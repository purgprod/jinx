// controllers/depositos/controller_webhook_pix_nubank.js
// Recebe todas as notificações Pix do Nubank:
//
//   • pix[]       → Pix RECEBIDO (depósito de usuário para Purg)
//   • pagamentos[] → Pix ENVIADO  (saque de Purg para usuário)
//
// Fluxo depósito (pix[]):
//   1. Valida assinatura HMAC
//   2. Localiza depósito pelo txid
//   3. Compara CPF do pagador com CPF cadastrado
//   4. CPF OK → credita saldo + Executado
//   5. CPF divergente → rejeita + solicita devolução ao Nubank
//
// Fluxo saque (pagamentos[]):
//   1. Localiza saque pelo endToEndId
//   2. REALIZADO → marca Executado
//   3. NAO_REALIZADO → marca Falhou + reverte débito na carteira

const logger = require('../../logger');
const { devolverPix, validarAssinaturaWebhook } = require('../../services/nubank_pix');

// --- Models depósito ---
const BuscarDepositoPorTxidModel       = require('../../models/depositos/model_deposito_buscar_por_txid');
const RejeitarDepositoModel            = require('../../models/depositos/model_deposito_rejeitar');

// --- Models saldo ---
const BuscarCarteiraModel    = require('../../models/endpoints/model_buscar_saldo_carteira');
const AtualizarCarteiraModel = require('../../models/endpoints/model_atualizar_saldo_carteira');

// --- Models depósito executar ---
const SolicitacaoExecutarDepositoModel = require('../../models/depositos/model_deposito_registro_executado');

// --- Models saque ---
const BuscarSaquePorE2eModel = require('../../models/saques/model_saque_buscar_por_e2e');
const ConfirmarSaqueModel    = require('../../models/saques/model_saque_confirmar');
const FalharSaqueModel       = require('../../models/saques/model_saque_falhar');

// ---------------------------------------------------------------------------
// Utilitários BigInt (mesma lógica do projeto)
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
    const abs     = bi < 0n ? -bi : bi;
    const intPart = abs / TEN_POW;
    const fracNum = abs % TEN_POW;
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
        logger.warn('[WebhookPix] Pix recebido sem txid, ignorado.', { endToEndId });
        return;
    }

    const deposito = await BuscarDepositoPorTxidModel.getDepositoPorTxid(txid);

    if (!deposito) {
        logger.warn(`[WebhookPix] Nenhum depósito encontrado para txid=${txid}.`);
        return;
    }

    if (deposito.status_deposito !== 'Analisando') {
        logger.info(`[WebhookPix] Depósito txid=${txid} já processado (${deposito.status_deposito}). Ignorado.`);
        return;
    }

    const cpfPagador    = normalizarCpf(pagador?.cpf);
    const cpfCadastrado = normalizarCpf(deposito.cpf);

    logger.info(`[WebhookPix] Depósito recebido. txid=${txid}, cpfPagador=${cpfPagador}, cpfCadastrado=${cpfCadastrado}`);

    // Valida CPF: pagador deve ser o próprio titular
    if (!cpfPagador || cpfPagador !== cpfCadastrado) {
        const motivo = `CPF do pagador (${cpfPagador || 'não informado'}) diverge do CPF cadastrado. Devolução solicitada.`;
        logger.warn(`[WebhookPix] CPF divergente. txid=${txid}. ${motivo}`);

        await RejeitarDepositoModel.rejeitarPorTxid(txid, motivo);

        try {
            await devolverPix(endToEndId, valor, 'Pagador não corresponde ao titular da conta.');
            logger.info(`[WebhookPix] Devolução solicitada. endToEndId=${endToEndId}`);
        } catch (errDevolucao) {
            logger.error(`[WebhookPix] FALHA NA DEVOLUÇÃO — requer ação manual! endToEndId=${endToEndId}`, {
                txid, valor, erro: errDevolucao.message
            });
        }

        return;
    }

    // CPF correto → credita saldo
    const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(deposito.usuario_id);

    if (!carteiraRows?.length) {
        throw new Error(`Carteira não encontrada para usuario_id=${deposito.usuario_id}`);
    }

    const saldoAtualBig = decimalToBigInt(String(carteiraRows[0].saldo ?? '0'));
    const depositoBig   = decimalToBigInt(String(valor));
    const novoSaldoStr  = bigIntToDecimalString(saldoAtualBig + depositoBig);

    await AtualizarCarteiraModel.updateCarteira(novoSaldoStr, deposito.usuario_id);

    const resultado = await SolicitacaoExecutarDepositoModel.executarSolicitacao(deposito.usuario_id);

    if (resultado.affectedRows === 0) {
        logger.error(`[WebhookPix] DIVERGÊNCIA: saldo creditado mas status do depósito não atualizado. txid=${txid}`);
    }

    logger.info(`[WebhookPix] Depósito executado. txid=${txid}, userId=${deposito.usuario_id}, valor=${valor}`);
}

// ---------------------------------------------------------------------------
// Processa Pix ENVIADO (saque) — confirmação ou falha
// ---------------------------------------------------------------------------
async function processarPagamentoEnviado(pagamento) {
    const { endToEndId, status, valor, motivo: motivoNubank } = pagamento;

    if (!endToEndId) {
        logger.warn('[WebhookPix] Pagamento enviado sem endToEndId, ignorado.');
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

    // REALIZADO → confirma o saque
    if (status === 'REALIZADO') {
        await ConfirmarSaqueModel.confirmarPorE2e(endToEndId);
        logger.info(`[WebhookPix] Saque confirmado. endToEndId=${endToEndId}, userId=${saque.usuario_id}, valor=${valor}`);
        return;
    }

    // NAO_REALIZADO → falhou, reverte débito na carteira
    const motivo = motivoNubank || 'Pix não realizado pelo Nubank.';
    await FalharSaqueModel.falharPorE2e(endToEndId, motivo);

    logger.warn(`[WebhookPix] Saque falhou. endToEndId=${endToEndId}, userId=${saque.usuario_id}. Revertendo saldo.`);

    try {
        const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(saque.usuario_id);

        if (!carteiraRows?.length) {
            throw new Error(`Carteira não encontrada para usuario_id=${saque.usuario_id}`);
        }

        const saldoAtualBig = decimalToBigInt(String(carteiraRows[0].saldo ?? '0'));
        const valorSaqueBig = decimalToBigInt(String(saque.valor_saque));
        const saldoRevertido = bigIntToDecimalString(saldoAtualBig + valorSaqueBig);

        await AtualizarCarteiraModel.updateCarteira(saldoRevertido, saque.usuario_id);

        logger.info(`[WebhookPix] Saldo revertido após falha. userId=${saque.usuario_id}, valorDevolvido=${saque.valor_saque}`);

    } catch (errReversao) {
        logger.error(`[WebhookPix] FALHA AO REVERTER SALDO — requer ação manual! endToEndId=${endToEndId}`, {
            userId: saque.usuario_id,
            valor:  saque.valor_saque,
            erro:   errReversao.message
        });
    }
}

// ---------------------------------------------------------------------------
// Handler HTTP do webhook
// ---------------------------------------------------------------------------
const WebhookPixNubankController = {
    async receberWebhook(req, res) {
        // ACK imediato para o Nubank não reenviar (padrão BACEN)
        res.status(200).json({ recebido: true });

        // Valida assinatura HMAC
        const assinatura = req.headers['x-nubank-signature'] || '';
        const bodyRaw    = JSON.stringify(req.body);

        if (!validarAssinaturaWebhook(bodyRaw, assinatura)) {
            logger.warn('[WebhookPix] Assinatura inválida. Requisição ignorada.', { assinatura });
            return;
        }

        // --- Pix recebidos (depósitos) ---
        const pixList = req.body?.pix;
        if (Array.isArray(pixList) && pixList.length > 0) {
            for (const pix of pixList) {
                try {
                    await processarPixRecebido(pix);
                } catch (err) {
                    logger.error('[WebhookPix] Erro ao processar Pix recebido:', { txid: pix.txid, erro: err.message });
                }
            }
        }

        // --- Pagamentos enviados (saques) ---
        const pagamentosList = req.body?.pagamentos;
        if (Array.isArray(pagamentosList) && pagamentosList.length > 0) {
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

module.exports = WebhookPixNubankController;
