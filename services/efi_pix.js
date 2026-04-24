// services/efi_pix.js
// Wrapper do SDK oficial do Efí Bank (sdk-node-apis-efi) para operações Pix.
//
// Operações disponíveis:
//   criarCobrancaPix  — Gera QR Code + copia e cola para o usuário depositar
//   enviarPix         — Envia Pix para a chave do usuário (saque)
//   devolverPix       — Estorna um Pix recebido (CPF divergente)
//   validarWebhook    — Valida token de segurança do webhook

const EfiPay = require('sdk-node-apis-efi');
const crypto = require('crypto');
const logger = require('../logger');

// ---------------------------------------------------------------------------
// Instância única do SDK (configurada via .env)
// ---------------------------------------------------------------------------
function criarInstancia() {
    const clientId     = process.env.EFI_CLIENT_ID;
    const clientSecret = process.env.EFI_CLIENT_SECRET;
    const certPath     = process.env.EFI_CERT_PATH;
    const sandbox      = process.env.EFI_SANDBOX === 'true';

    if (!clientId || !clientSecret) {
        throw new Error('EFI_CLIENT_ID e EFI_CLIENT_SECRET devem estar definidos no .env');
    }
    if (!certPath) {
        throw new Error('EFI_CERT_PATH deve estar definido no .env (caminho para o certificado .p12)');
    }

    return new EfiPay({
        client_id:     clientId,
        client_secret: clientSecret,
        sandbox,
        certificate:   certPath
    });
}

// Inicializado na primeira chamada para não lançar erro no boot
// caso as variáveis de ambiente ainda não estejam preenchidas.
let _efi = null;
function getEfi() {
    if (!_efi) _efi = criarInstancia();
    return _efi;
}

// ---------------------------------------------------------------------------
// Cria cobrança Pix imediata (depósito — usuário paga para Purg)
//
// @param {string} valor         Valor com 2 decimais ex: "150.00"
// @param {string} cpf           CPF do devedor (11 dígitos)
// @param {string} nome          Nome do devedor
// @param {number} expiracao     Segundos até expirar (padrão 3600 = 1h)
// @param {string} infoAdicional Informação exibida ao pagador
//
// @returns {{ txid, pixCopiaECola, qrCode }}
// ---------------------------------------------------------------------------
async function criarCobrancaPix({ valor, cpf, nome, expiracao = 3600, infoAdicional = 'Depósito Purg' }) {
    try {
        const efi = getEfi();

        const body = {
            calendario:     { expiracao },
            devedor:        { cpf: String(cpf).replace(/\D/g, ''), nome },
            valor:          { original: valor },
            chave:          process.env.EFI_PIX_KEY,
            infoAdicionais: [{ nome: 'Origem', valor: infoAdicional }]
        };

        const resposta = await efi.pixCreateImmediateCharge({}, body);

        logger.info(`[EfiPix] Cobrança criada. txid=${resposta.txid}`);

        return {
            txid:          resposta.txid,
            pixCopiaECola: resposta.pixCopiaECola,
            qrCode:        resposta.loc?.location ?? null
        };

    } catch (err) {
        const detalhe = err.response?.data ?? err.message;
        logger.error('[EfiPix] Erro ao criar cobrança Pix:', detalhe);
        throw new Error('Falha ao gerar cobrança Pix no Efí Bank.');
    }
}

// ---------------------------------------------------------------------------
// Envia Pix para a chave do usuário (saque — Purg paga para usuário)
//
// @param {string} chaveDestino  Chave Pix do destinatário
// @param {string} valor         Valor com 2 decimais ex: "150.00"
// @param {string} descricao     Informação ao destinatário
//
// @returns {{ endToEndId, status }}
// ---------------------------------------------------------------------------
async function enviarPix({ chaveDestino, valor, descricao = 'Saque Purg' }) {
    try {
        const efi = getEfi();

        const idEnvio = crypto.randomBytes(16).toString('hex'); // 32 chars alfanuméricos

        const body = {
            valor,
            pagador: {
                chave:       process.env.EFI_PIX_KEY,
                infoPagador: descricao
            },
            favorecido: {
                chave: chaveDestino
            }
        };

        const resposta = await efi.pixSend({ idEnvio }, body);

        logger.info(`[EfiPix] Pix enviado. endToEndId=${resposta.e2eId}, status=${resposta.status}`);

        return {
            endToEndId: resposta.e2eId,
            status:     resposta.status
        };

    } catch (err) {
        const detalhe = err.response?.data ?? err.message;
        logger.error(`[EfiPix] Erro ao enviar Pix (chave=${chaveDestino}, valor=${valor}):`, detalhe);
        throw new Error('Falha ao enviar Pix via Efí Bank.');
    }
}

// ---------------------------------------------------------------------------
// Solicita devolução de um Pix recebido (CPF divergente)
//
// @param {string} endToEndId  ID fim-a-fim da transação original
// @param {string} valor       Valor a devolver ex: "150.00"
// @param {string} motivo      Motivo para registro interno
// ---------------------------------------------------------------------------
async function devolverPix(endToEndId, valor, motivo = 'Pagador não identificado') {
    try {
        const efi = getEfi();
        const idDevolucao = crypto.randomBytes(8).toString('hex');

        await efi.pixDevolution(
            { id: endToEndId, id_devolucao: idDevolucao },
            { valor }
        );

        logger.info(`[EfiPix] Devolução solicitada. endToEndId=${endToEndId}, valor=${valor}`);
        return { sucesso: true, idDevolucao };

    } catch (err) {
        const detalhe = err.response?.data ?? err.message;
        logger.error(`[EfiPix] Erro ao solicitar devolução (endToEndId=${endToEndId}):`, detalhe);
        throw new Error('Falha ao solicitar devolução do Pix.');
    }
}

// ---------------------------------------------------------------------------
// Valida o token de segurança enviado pelo Efí no header do webhook.
// Configure EFI_WEBHOOK_TOKEN com o mesmo valor registrado no painel do Efí.
//
// @param {string} tokenRecebido  Valor do header 'x-efi-webhook-token'
// @returns {boolean}
// ---------------------------------------------------------------------------
function validarWebhook(tokenRecebido) {
    const tokenEsperado = process.env.EFI_WEBHOOK_TOKEN;

    if (!tokenEsperado) {
        logger.warn('[EfiPix] EFI_WEBHOOK_TOKEN não definido — validação de webhook ignorada.');
        return true;
    }

    if (!tokenRecebido) return false;

    // timingSafeEqual previne timing-attack
    try {
        return crypto.timingSafeEqual(
            Buffer.from(tokenEsperado),
            Buffer.from(tokenRecebido)
        );
    } catch {
        return false;
    }
}

module.exports = {
    criarCobrancaPix,
    enviarPix,
    devolverPix,
    validarWebhook
};
