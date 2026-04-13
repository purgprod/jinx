// services/nubank_pix.js
// Cliente da API Pix do Nubank Empresas (padrão BACEN Open Finance)
// Autenticação: OAuth 2.0 com mTLS (certificado cliente)

const axios = require('axios');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../logger');

// ---------------------------------------------------------------------------
// Configuração: lida do .env
// ---------------------------------------------------------------------------
const NUBANK_BASE_URL       = process.env.NUBANK_BASE_URL || 'https://prod.nubank.com.br';
const NUBANK_CLIENT_ID      = process.env.NUBANK_CLIENT_ID;
const NUBANK_CLIENT_SECRET  = process.env.NUBANK_CLIENT_SECRET;
const NUBANK_CERT_PATH      = process.env.NUBANK_CERT_PATH;   // Caminho para o certificado .pem
const NUBANK_KEY_PATH       = process.env.NUBANK_KEY_PATH;    // Caminho para a chave privada .pem
const NUBANK_WEBHOOK_SECRET = process.env.NUBANK_WEBHOOK_SECRET; // Segredo para validar webhooks

// ---------------------------------------------------------------------------
// Cache de token OAuth (evita requisição a cada chamada)
// ---------------------------------------------------------------------------
let _token = null;
let _tokenExpiry = 0;

/**
 * Cria um agente HTTPS com o certificado mTLS do Nubank.
 * Necessário para autenticação via certificado cliente.
 */
function criarAgenteHttps() {
    if (!NUBANK_CERT_PATH || !NUBANK_KEY_PATH) {
        throw new Error('NUBANK_CERT_PATH e NUBANK_KEY_PATH devem estar definidos no .env');
    }

    return new https.Agent({
        cert: fs.readFileSync(NUBANK_CERT_PATH),
        key:  fs.readFileSync(NUBANK_KEY_PATH),
        rejectUnauthorized: true
    });
}

/**
 * Obtém (ou renova) o token OAuth 2.0 do Nubank via client_credentials + mTLS.
 * O token é cacheado até 60 segundos antes da expiração.
 */
async function obterToken() {
    const agora = Date.now();

    // Retorna token em cache se ainda válido
    if (_token && agora < _tokenExpiry) {
        return _token;
    }

    if (!NUBANK_CLIENT_ID || !NUBANK_CLIENT_SECRET) {
        throw new Error('NUBANK_CLIENT_ID e NUBANK_CLIENT_SECRET devem estar definidos no .env');
    }

    try {
        const agente = criarAgenteHttps();

        const resposta = await axios.post(
            `${NUBANK_BASE_URL}/api/v1/oauth/token`,
            new URLSearchParams({
                grant_type:    'client_credentials',
                client_id:     NUBANK_CLIENT_ID,
                client_secret: NUBANK_CLIENT_SECRET,
                scope:         'cob.write cob.read pix.read'
            }).toString(),
            {
                httpsAgent: agente,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const { access_token, expires_in } = resposta.data;

        // Cache: expira 60 s antes para evitar uso de token expirado
        _token = access_token;
        _tokenExpiry = agora + (expires_in - 60) * 1000;

        logger.info('[NubankPix] Token OAuth renovado com sucesso.');
        return _token;

    } catch (err) {
        const msg = err.response?.data || err.message;
        logger.error('[NubankPix] Erro ao obter token OAuth:', msg);
        throw new Error('Falha na autenticação com o Nubank.');
    }
}

/**
 * Gera um txid único no padrão BACEN:
 * - Alfanumérico [a-zA-Z0-9]
 * - Entre 26 e 35 caracteres
 */
function gerarTxid() {
    return crypto.randomBytes(16).toString('hex'); // 32 caracteres hexadecimais
}

/**
 * Cria uma cobrança Pix imediata (cob) no Nubank.
 *
 * @param {Object} params
 * @param {string} params.valor         - Valor em string com 2 decimais ex: "150.00"
 * @param {string} params.cpf           - CPF do pagador esperado (11 dígitos)
 * @param {string} params.nome          - Nome do pagador esperado
 * @param {number} params.expiracao     - Tempo de expiração em segundos (padrão: 3600 = 1h)
 * @param {string} params.infoAdicional - Informação adicional exibida ao pagador
 *
 * @returns {Object} { txid, qrCode, pixCopiaECola }
 */
async function criarCobrancaPix({ valor, cpf, nome, expiracao = 3600, infoAdicional = 'Depósito Purg' }) {
    const token = await obterToken();
    const txid  = gerarTxid();
    const agente = criarAgenteHttps();

    const payload = {
        calendario: {
            expiracao
        },
        devedor: {
            cpf,
            nome
        },
        valor: {
            original: valor
        },
        infoAdicionais: [
            {
                nome:  'Origem',
                valor: infoAdicional
            }
        ]
    };

    try {
        const resposta = await axios.put(
            `${NUBANK_BASE_URL}/v2/cob/${txid}`,
            payload,
            {
                httpsAgent: agente,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { txid: txidRetornado, pixCopiaECola, loc } = resposta.data;

        // O QR Code em base64 pode vir via endpoint separado ou já na resposta
        // Nubank retorna 'pixCopiaECola' diretamente no objeto de cobrança
        logger.info(`[NubankPix] Cobrança criada. txid=${txidRetornado}`);

        return {
            txid:         txidRetornado || txid,
            qrCode:       loc?.location || null,
            pixCopiaECola
        };

    } catch (err) {
        const msg = err.response?.data || err.message;
        logger.error(`[NubankPix] Erro ao criar cobrança Pix (txid=${txid}):`, msg);
        throw new Error('Falha ao gerar cobrança Pix no Nubank.');
    }
}

/**
 * Solicita a devolução (estorno) de um Pix recebido.
 * Utilizado quando o CPF do pagador não confere com o cadastro.
 *
 * @param {string} endToEndId - Identificador fim-a-fim da transação original
 * @param {string} valor      - Valor a devolver em string ex: "150.00"
 * @param {string} motivo     - Motivo da devolução (exibido ao pagador)
 */
async function devolverPix(endToEndId, valor, motivo = 'Pagador não identificado') {
    const token  = await obterToken();
    const agente = criarAgenteHttps();
    const idDevolucao = crypto.randomBytes(8).toString('hex'); // ID único da devolução

    try {
        await axios.put(
            `${NUBANK_BASE_URL}/v2/pix/${endToEndId}/devolucao/${idDevolucao}`,
            {
                valor,
                natureza: 'ORIGINAL',
                descricao: motivo
            },
            {
                httpsAgent: agente,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info(`[NubankPix] Devolução solicitada. endToEndId=${endToEndId}, valor=${valor}`);
        return { sucesso: true, idDevolucao };

    } catch (err) {
        const msg = err.response?.data || err.message;
        logger.error(`[NubankPix] Erro ao solicitar devolução (endToEndId=${endToEndId}):`, msg);
        throw new Error('Falha ao solicitar devolução do Pix.');
    }
}

/**
 * Valida a assinatura HMAC-SHA256 enviada pelo Nubank no header do webhook.
 * Garante que a requisição partiu realmente do Nubank.
 *
 * @param {string} payload    - Body raw da requisição (string)
 * @param {string} assinatura - Valor do header 'x-nubank-signature'
 * @returns {boolean}
 */
function validarAssinaturaWebhook(payload, assinatura) {
    if (!NUBANK_WEBHOOK_SECRET) {
        logger.warn('[NubankPix] NUBANK_WEBHOOK_SECRET não definido — validação de webhook ignorada.');
        return true;
    }

    const hmac = crypto
        .createHmac('sha256', NUBANK_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(assinatura || '')
    );
}

/**
 * Envia um Pix para a chave do destinatário (Pix OUT — saque para usuário).
 *
 * @param {Object} params
 * @param {string} params.chaveDestino - Chave Pix do destinatário (CPF, e-mail, celular ou aleatória)
 * @param {string} params.valor        - Valor em string com 2 decimais ex: "150.00"
 * @param {string} params.descricao    - Descrição exibida ao destinatário
 *
 * @returns {Object} { endToEndId, status }
 */
async function enviarPix({ chaveDestino, valor, descricao = 'Saque Purg' }) {
    const token  = await obterToken();
    const agente = criarAgenteHttps();

    const payload = {
        valor,
        chave:     chaveDestino,
        descricao
    };

    try {
        const resposta = await axios.post(
            `${NUBANK_BASE_URL}/v2/pix/payments`,
            payload,
            {
                httpsAgent: agente,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { endToEndId, status } = resposta.data;

        logger.info(`[NubankPix] Pix enviado. endToEndId=${endToEndId}, status=${status}`);

        return { endToEndId, status };

    } catch (err) {
        const msg = err.response?.data || err.message;
        logger.error(`[NubankPix] Erro ao enviar Pix (chave=${chaveDestino}, valor=${valor}):`, msg);
        throw new Error('Falha ao enviar Pix via Nubank.');
    }
}

module.exports = {
    criarCobrancaPix,
    enviarPix,
    devolverPix,
    validarAssinaturaWebhook
};
