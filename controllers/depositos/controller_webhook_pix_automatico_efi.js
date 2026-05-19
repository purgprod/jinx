// controllers/depositos/controller_webhook_pix_automatico_efi.js
// Recebe notificações de PIX Automático do Efí Bank.
//
// O PIX Automático é uma cobrança recorrente mensal iniciada pela Efí,
// equivalente ao cartão de crédito mas via Pix. A taxa fixa é de R$ 3,50
// por cobrança aprovada, amortizada a 25% dos rendimentos diários (Lulu).
//
// Payload esperado (campo pixAutoCobrança ou similar da Efí):
//   { txid, endToEndId, valor, status, pagador: { cpf, nome } }
//
// Fluxo:
//   1. Valida token do webhook
//   2. Localiza depósito pelo txid
//   3. Se status CONCLUIDA → credita saldo + registra taxa Lulu pix_automatico

const logger = require('../../logger');
const { validarWebhook } = require('../../services/efi_pix');
const { withTransaction } = require('../../database/transaction');

const BuscarDepositoPorTxidModel       = require('../../models/depositos/model_deposito_buscar_por_txid');
const SolicitacaoExecutarDepositoModel = require('../../models/depositos/model_deposito_registro_executado');
const BuscarCarteiraModel              = require('../../models/endpoints/model_buscar_saldo_carteira');
const AtualizarCarteiraModel           = require('../../models/endpoints/model_atualizar_saldo_carteira');
const { alocarSaldoEntreObjetivos }    = require('../../services/objetivos_service');
const { sincronizarLigaUsuario }       = require('../../services/liga_service');
const UpdateAssinaturaClienteModel     = require('../../models/assinaturas/model_update_assinatura_cliente');
const NotificacoesModel                = require('../../models/webhook/model_notificacoes');
const LuluTaxaInserirModel             = require('../../models/lulu/model_lulu_taxa_inserir');
const LuluConfigBuscarModel            = require('../../models/lulu/model_lulu_config_buscar');

const SCALE   = 8;
const TEN_POW = 10n ** BigInt(SCALE);

function decimalToBigInt(value) {
    if (value === null || value === undefined) return 0n;
    let s = typeof value === 'number' ? value.toString() : String(value);
    s = s.trim();
    if (s === '') return 0n;
    const [intPart, fracPart = ''] = s.split('.');
    return BigInt(intPart) * TEN_POW + BigInt(fracPart.slice(0, SCALE).padEnd(SCALE, '0'));
}

function bigIntToDecimalString(bi) {
    const abs      = bi < 0n ? -bi : bi;
    const intPart  = abs / TEN_POW;
    const fracNum  = abs % TEN_POW;
    const fracPart = fracNum.toString().padStart(SCALE, '0').replace(/0+$/, '');
    return (bi < 0n ? '-' : '') + (fracPart ? `${intPart}.${fracPart}` : `${intPart}`);
}

async function processarCobrancaAutomatica(cobranca) {
    const { txid, valor, status } = cobranca;

    if (status !== 'CONCLUIDA') {
        logger.info(`[WebhookPixAuto] Cobrança ignorada (status=${status}). txid=${txid}`);
        return;
    }

    if (!txid) {
        logger.warn('[WebhookPixAuto] Cobrança sem txid — ignorada.');
        return;
    }

    const deposito = await BuscarDepositoPorTxidModel.getDepositoPorTxid(txid);
    if (!deposito) {
        logger.warn(`[WebhookPixAuto] Nenhum depósito encontrado para txid=${txid}.`);
        return;
    }

    if (deposito.status_deposito !== 'Processando') {
        logger.info(`[WebhookPixAuto] Depósito txid=${txid} já processado (${deposito.status_deposito}). Ignorado.`);
        return;
    }

    const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(deposito.usuario_id);
    if (!carteiraRows?.length) throw new Error(`Carteira não encontrada para usuario_id=${deposito.usuario_id}`);

    const novoSaldo = bigIntToDecimalString(
        decimalToBigInt(String(carteiraRows[0].saldo ?? '0')) + decimalToBigInt(String(valor))
    );

    await withTransaction(async (conn) => {
        await AtualizarCarteiraModel.updateCarteira(novoSaldo, deposito.usuario_id, conn);
        const resultado = await SolicitacaoExecutarDepositoModel.executarSolicitacao(deposito.id, conn);
        if (resultado.affectedRows === 0) {
            throw new Error(`Depósito txid=${txid} não estava em 'Processando' — possível reprocessamento duplicado`);
        }
        await alocarSaldoEntreObjetivos(conn, deposito.usuario_id, valor);
        await UpdateAssinaturaClienteModel.promoverParaPro(deposito.usuario_id, conn);
    });

    logger.info(`[WebhookPixAuto] Depósito executado. txid=${txid}, userId=${deposito.usuario_id}, valor=${valor}`);

    setImmediate(async () => {
        try {
            await NotificacoesModel.criar(deposito.usuario_id, 'deposito_confirmado', { valor });
        } catch (err) {
            logger.error('[Nami] Falha ao enfileirar notificação pix_automatico', { userId: deposito.usuario_id, erro: err.message });
        }

        try {
            const luluConfig = await LuluConfigBuscarModel.getConfig();
            const valorTaxa  = parseFloat(luluConfig.taxa_pix_automatico_valor).toFixed(2);
            await LuluTaxaInserirModel.inserir({ usuarioId: deposito.usuario_id, depositoId: deposito.id, valorTaxa, tipo: 'pix_automatico' });
            logger.info(`[Lulu] Taxa PIX automático registrada. userId=${deposito.usuario_id}, valorTaxa=${valorTaxa}`);
        } catch (errLulu) {
            logger.error(`[Lulu] Erro ao registrar taxa PIX automático. userId=${deposito.usuario_id}`, { erro: errLulu.message });
        }

        try {
            await sincronizarLigaUsuario(deposito.usuario_id);
        } catch (errLiga) {
            logger.error(`[WebhookPixAuto] Erro ao sincronizar liga. userId=${deposito.usuario_id}`, { erro: errLiga.message });
        }
    });
}

const WebhookPixAutomaticoEfiController = {
    async receberWebhook(req, res) {
        res.status(200).json({ recebido: true });

        const token = req.headers['x-efi-webhook-token'] || '';
        if (!validarWebhook(token)) {
            logger.warn('[WebhookPixAuto] Token inválido. Requisição ignorada.');
            return;
        }

        const cobranças = req.body?.pixAutoCobrancas;
        if (!Array.isArray(cobranças)) {
            logger.warn('[WebhookPixAuto] Payload sem pixAutoCobrancas — ignorado.', { body: req.body });
            return;
        }

        for (const cobranca of cobranças) {
            try {
                await processarCobrancaAutomatica(cobranca);
            } catch (err) {
                logger.error('[WebhookPixAuto] Erro ao processar cobrança automática:', { txid: cobranca.txid, erro: err.message });
            }
        }
    },
};

module.exports = WebhookPixAutomaticoEfiController;
