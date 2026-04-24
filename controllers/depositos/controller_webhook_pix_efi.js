// controllers/depositos/controller_webhook_pix_efi.js
// Recebe todas as notificações Pix do Efí Bank:
//
//   • pix[]        → Pix RECEBIDO (depósito — usuário pagou para Purg)
//   • pagamentos[] → Pix ENVIADO  (saque — Purg pagou para usuário)
//
// Fluxo depósito (pix[]):
//   1. Valida token do webhook
//   2. Localiza depósito pelo txid
//   3. Compara CPF do pagador com CPF cadastrado
//   4. CPF OK  → credita saldo + marca Executado
//   5. CPF NOK → rejeita + solicita devolução ao Efí
//
// Fluxo saque (pagamentos[]):
//   1. Localiza saque pelo endToEndId
//   2. REALIZADO     → marca Executado
//   3. NAO_REALIZADO → marca Falhou + reverte débito na carteira

const logger = require('../../logger');
const { devolverPix, validarWebhook } = require('../../services/efi_pix');
const { withTransaction } = require('../../database/transaction');

// --- Models depósito ---
const BuscarDepositoPorTxidModel       = require('../../models/depositos/model_deposito_buscar_por_txid');
const RejeitarDepositoModel            = require('../../models/depositos/model_deposito_rejeitar');
const SolicitacaoExecutarDepositoModel = require('../../models/depositos/model_deposito_registro_executado');

// --- Models saque ---
const BuscarSaquePorE2eModel = require('../../models/saques/model_saque_buscar_por_e2e');
const ConfirmarSaqueModel    = require('../../models/saques/model_saque_confirmar');
const FalharSaqueModel       = require('../../models/saques/model_saque_falhar');

// --- Models carteira ---
const BuscarCarteiraModel    = require('../../models/endpoints/model_buscar_saldo_carteira');
const AtualizarCarteiraModel = require('../../models/endpoints/model_atualizar_saldo_carteira');

// --- Engine de Objetivos ---
const { alocarSaldoEntreObjetivos } = require('../../services/objetivos_service');

// --- Liga ---
const { sincronizarLigaUsuario } = require('../../services/liga_service');

// --- Compra automática de pins pós-depósito ---
const BuscarUsuariosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_usuarios_e_carteiras');
const { processarUsuario } = require('../../services/compra_pins_usuario_service');

// ---------------------------------------------------------------------------
// Utilitários BigInt
// ---------------------------------------------------------------------------
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

function normalizarCpf(cpf) {
    return String(cpf || '').replace(/\D/g, '');
}

// ---------------------------------------------------------------------------
// Processa Pix RECEBIDO (depósito)
// ---------------------------------------------------------------------------
async function processarPixRecebido(pix) {
    const { txid, endToEndId, valor, pagador } = pix;

    if (!txid) {
        if (endToEndId) {
            // Efí envia confirmação de PIX enviado (saque) dentro de pix[] sem txid.
            // Roteamos para o handler de pagamento enviado com status REALIZADO.
            logger.info(`[WebhookPix] Pix sem txid — confirmação de saque via Efí. endToEndId=${endToEndId}`);
            await processarPagamentoEnviado({ endToEndId, status: pix.status || 'REALIZADO', valor });
        } else {
            logger.warn('[WebhookPix] Pix sem txid nem endToEndId — ignorado. Payload completo:', { pix });
        }
        return;
    }

    const deposito = await BuscarDepositoPorTxidModel.getDepositoPorTxid(txid);

    if (!deposito) {
        logger.warn(`[WebhookPix] Nenhum depósito encontrado para txid=${txid}.`);
        return;
    }

    if (deposito.status_deposito !== 'Processando') {
        logger.info(`[WebhookPix] Depósito txid=${txid} já processado (${deposito.status_deposito}). Ignorado.`);
        return;
    }

    const cpfPagador    = normalizarCpf(pagador?.cpf);
    const cpfCadastrado = normalizarCpf(deposito.cpf);

    logger.info(`[WebhookPix] Depósito recebido. txid=${txid}, cpfPagador=${cpfPagador || 'não informado'}, cpfCadastrado=${cpfCadastrado}`);

    // Valida CPF apenas quando o banco do pagador envia o dado.
    // CPF ausente é aceito pois o txid já garante que é o QR Code correto sendo pago.
    if (cpfPagador && cpfPagador !== cpfCadastrado) {
        const motivo = `CPF do pagador (${cpfPagador}) diverge do CPF cadastrado. Devolução solicitada.`;
        logger.warn(`[WebhookPix] CPF divergente. txid=${txid}. ${motivo}`);

        await RejeitarDepositoModel.rejeitarPorTxid(txid, motivo);

        try {
            await devolverPix(endToEndId, valor, 'Pagador não corresponde ao titular da conta.');
            logger.info(`[WebhookPix] Devolução solicitada. endToEndId=${endToEndId}`);
        } catch (errDevolucao) {
            logger.error('[WebhookPix] FALHA NA DEVOLUÇÃO — requer ação manual!', {
                endToEndId, txid, valor, erro: errDevolucao.message
            });
        }
        return;
    }

    // CPF correto → credita saldo e marca depósito como Executado (atômico)
    const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(deposito.usuario_id);
    if (!carteiraRows?.length) throw new Error(`Carteira não encontrada para usuario_id=${deposito.usuario_id}`);

    const novoSaldo = bigIntToDecimalString(
        decimalToBigInt(String(carteiraRows[0].saldo ?? '0')) + decimalToBigInt(String(valor))
    );

    await withTransaction(async (conn) => {
        await AtualizarCarteiraModel.updateCarteira(novoSaldo, deposito.usuario_id, conn);
        const resultado = await SolicitacaoExecutarDepositoModel.executarSolicitacao(deposito.usuario_id, conn);
        if (resultado.affectedRows === 0) {
            throw new Error(`Depósito txid=${txid} não estava em 'Processando' — possível reprocessamento duplicado`);
        }
        await alocarSaldoEntreObjetivos(conn, deposito.usuario_id, valor);
    });

    logger.info(`[WebhookPix] Depósito executado. txid=${txid}, userId=${deposito.usuario_id}, valor=${valor}`);

    setImmediate(async () => {
        try {
            await sincronizarLigaUsuario(deposito.usuario_id);
            logger.info(`[WebhookPix] Liga/pontos sincronizados pós-depósito. userId=${deposito.usuario_id}`);
        } catch (errLiga) {
            logger.error(`[WebhookPix] Erro ao sincronizar liga pós-depósito. userId=${deposito.usuario_id}`, { erro: errLiga.message });
        }
    });

    setImmediate(async () => {
        try {
            const usuario = await BuscarUsuariosCarteirasModel.getUsuarioCarteiraPorId(deposito.usuario_id);
            if (usuario) {
                logger.info(`[WebhookPix] Iniciando compra automática de pins. userId=${deposito.usuario_id}`);
                await processarUsuario(usuario);
                logger.info(`[WebhookPix] Compra automática de pins concluída. userId=${deposito.usuario_id}`);
            } else {
                logger.warn(`[WebhookPix] Usuário inativo ou não encontrado para compra automática. userId=${deposito.usuario_id}`);
            }
        } catch (errCompra) {
            logger.error(`[WebhookPix] Erro na compra automática de pins. userId=${deposito.usuario_id}`, { erro: errCompra.message });
        }
    });
}

// ---------------------------------------------------------------------------
// Processa Pix ENVIADO — confirmação ou falha (saque)
// ---------------------------------------------------------------------------
async function processarPagamentoEnviado(pagamento) {
    const { endToEndId, status, valor, motivo: motivoEfi } = pagamento;

    if (!endToEndId) {
        logger.warn('[WebhookPix] Pagamento enviado sem endToEndId — ignorado.');
        return;
    }

    const saque = await BuscarSaquePorE2eModel.getSaquePorE2e(endToEndId);

    if (!saque) {
        logger.warn(`[WebhookPix] Nenhum saque encontrado para endToEndId=${endToEndId}.`);
        return;
    }

    if (saque.status_saque !== 'Processando') {
        logger.info(`[WebhookPix] Saque e2e=${endToEndId} já processado (${saque.status_saque}). Ignorado.`);
        return;
    }

    // REALIZADO → confirma
    if (status === 'REALIZADO') {
        await ConfirmarSaqueModel.confirmarPorE2e(endToEndId);
        logger.info(`[WebhookPix] Saque confirmado. endToEndId=${endToEndId}, userId=${saque.usuario_id}, valor=${valor}`);
        return;
    }

    // NAO_REALIZADO → falha + reverte saldo (atômico: ambos ou nenhum)
    const motivo = motivoEfi || 'Pix não realizado pelo Efí Bank.';
    logger.warn(`[WebhookPix] Saque falhou. Revertendo saldo. endToEndId=${endToEndId}, userId=${saque.usuario_id}`);

    const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(saque.usuario_id);
    if (!carteiraRows?.length) throw new Error(`Carteira não encontrada para usuario_id=${saque.usuario_id}`);

    const saldoRevertido = bigIntToDecimalString(
        decimalToBigInt(String(carteiraRows[0].saldo ?? '0')) + decimalToBigInt(String(saque.valor_saque))
    );

    await withTransaction(async (conn) => {
        await FalharSaqueModel.falharPorE2e(endToEndId, motivo, conn);
        await AtualizarCarteiraModel.updateCarteira(saldoRevertido, saque.usuario_id, conn);
        await alocarSaldoEntreObjetivos(conn, saque.usuario_id, String(saque.valor_saque));
    });

    logger.info(`[WebhookPix] Saldo revertido. userId=${saque.usuario_id}, valor=${saque.valor_saque}`);

    setImmediate(async () => {
        try {
            await sincronizarLigaUsuario(saque.usuario_id);
            logger.info(`[WebhookPix] Liga/pontos sincronizados pós-reversão de saque. userId=${saque.usuario_id}`);
        } catch (errLiga) {
            logger.error(`[WebhookPix] Erro ao sincronizar liga pós-reversão. userId=${saque.usuario_id}`, { erro: errLiga.message });
        }
    });
}

// ---------------------------------------------------------------------------
// Handler HTTP do webhook
// ---------------------------------------------------------------------------
const WebhookPixEfiController = {
    async receberWebhook(req, res) {
        // ACK imediato — Efí não reenvia se receber 200 rapidamente
        res.status(200).json({ recebido: true });

        // Valida token de segurança
        const token = req.headers['x-efi-webhook-token'] || '';
        if (!validarWebhook(token)) {
            logger.warn('[WebhookPix] Token inválido. Requisição ignorada.');
            return;
        }

        // Pix recebidos (depósitos)
        const pixList = req.body?.pix;
        if (Array.isArray(pixList)) {
            for (const pix of pixList) {
                try {
                    await processarPixRecebido(pix);
                } catch (err) {
                    logger.error('[WebhookPix] Erro ao processar Pix recebido:', { txid: pix.txid, erro: err.message });
                }
            }
        }

        // Pagamentos enviados (saques)
        const pagamentosList = req.body?.pagamentos;
        if (Array.isArray(pagamentosList)) {
            for (const pagamento of pagamentosList) {
                try {
                    await processarPagamentoEnviado(pagamento);
                } catch (err) {
                    logger.error('[WebhookPix] Erro ao processar pagamento enviado:', { endToEndId: pagamento.endToEndId, erro: err.message });
                }
            }
        }
    }
};

module.exports = WebhookPixEfiController;
