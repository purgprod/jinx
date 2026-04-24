// services/pix_estatico.js
// Gera string Pix Copia e Cola (EMV/BR Code) estática sem depender de API externa.
// O valor único (base + centavos aleatórios 1–99) serve como identificador do depósito.

const logger = require('../logger');

// ---------------------------------------------------------------------------
// TLV helper e CRC16-CCITT (padrão Bacen BR Code / EMV)
// ---------------------------------------------------------------------------
function tlv(id, value) {
    return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function calcCRC16(str) {
    let crc = 0xFFFF;
    for (const char of str) {
        crc ^= char.charCodeAt(0) << 8;
        for (let i = 0; i < 8; i++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ---------------------------------------------------------------------------
// Gera a string EMV Pix Copia e Cola para a chave estática configurada.
//
// @param {string} valor      Valor com 2 decimais ex: "150.47"
// @param {string} referencia Texto livre (max 25 chars), ex: "DEP001"
// @returns {string}          String EMV completa incluindo CRC16
// ---------------------------------------------------------------------------
function gerarEMV({ valor, referencia = '***' }) {
    const chave  = process.env.EFI_PIX_KEY;
    const nome   = (process.env.PIX_NOME   || 'PURG').substring(0, 25);
    const cidade = (process.env.PIX_CIDADE || 'BRASIL').substring(0, 15);

    if (!chave) throw new Error('EFI_PIX_KEY não definida no .env');

    const merchantAccountInfo = tlv('26',
        tlv('00', 'BR.GOV.BCB.PIX') +
        tlv('01', chave)
    );

    const additionalDataField = tlv('62', tlv('05', referencia.substring(0, 25)));

    let payload =
        tlv('00', '01') +
        merchantAccountInfo +
        tlv('52', '0000') +
        tlv('53', '986') +
        tlv('54', valor) +
        tlv('58', 'BR') +
        tlv('59', nome) +
        tlv('60', cidade) +
        additionalDataField +
        '6304';

    return payload + calcCRC16(payload);
}

// ---------------------------------------------------------------------------
// Gera um valor único (valorBase + X centavos aleatórios, 1–99) que não
// esteja em uso por nenhum depósito ativo (status = 'Processando').
//
// Importa o model dinamicamente para evitar dependência circular durante boot.
//
// @param {string|number} valorBase  Valor base do depósito ex: "150.00"
// @returns {Promise<string>}        Valor único ex: "150.47"
// ---------------------------------------------------------------------------
async function gerarValorUnico(valorBase, tentativas = 0) {
    if (tentativas > 98) {
        throw new Error('Muitos depósitos pendentes com o mesmo valor base. Tente em instantes.');
    }

    // Importação lazy para não carregar o module antes da DB estar pronta
    const BuscarDepositoPorValorModel = require('../models/depositos/model_deposito_buscar_por_valor');

    const extra      = Math.floor(Math.random() * 99) + 1;
    const valorUnico = (parseFloat(valorBase) + extra / 100).toFixed(2);

    const emUso = await BuscarDepositoPorValorModel.getDepositoPorValorUnico(valorUnico);
    if (emUso) {
        logger.debug(`[PixEstatico] Valor único ${valorUnico} já em uso. Tentando novamente...`);
        return gerarValorUnico(valorBase, tentativas + 1);
    }

    return valorUnico;
}

module.exports = { gerarEMV, gerarValorUnico };
