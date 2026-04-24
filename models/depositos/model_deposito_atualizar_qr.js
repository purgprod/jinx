// models/depositos/model_deposito_atualizar_qr.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarDepositoQrModel = {
    /**
     * Grava o txid, QR Code e string copia e cola no registro do depósito
     * após a cobrança ser criada no Nubank.
     *
     * @param {number|string} depositoId   - ID do depósito na tabela depositos
     * @param {string}        txid         - txid retornado pelo Nubank
     * @param {string}        qrCode       - URL do QR Code (location)
     * @param {string}        pixCopiaECola - String EMV para copia e cola
     */
    async atualizarQr(depositoId, txid, qrCode, pixCopiaECola) {
        const query = `
            UPDATE depositos
            SET
                txid           = ?,
                qr_code        = ?,
                pix_copia_cola = ?
            WHERE id = ?
              AND status_deposito = 'Processando';
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [txid, qrCode, pixCopiaECola, depositoId], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao atualizar QR do depósito ID=${depositoId}:`, error);
                    return reject(new Error('Erro ao gravar dados do Pix no depósito.'));
                }
                resolve(results);
            });
        });
    },

    async atualizarValorUnico(depositoId, valorUnico, pixCopiaECola) {
        const query = `
            UPDATE depositos
            SET
                valor_unico    = ?,
                pix_copia_cola = ?
            WHERE id = ?
              AND status_deposito = 'Processando';
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [valorUnico, pixCopiaECola, depositoId], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao atualizar valor_unico do depósito ID=${depositoId}:`, error);
                    return reject(new Error('Erro ao gravar valor único do Pix no depósito.'));
                }
                resolve(results);
            });
        });
    }
};

module.exports = AtualizarDepositoQrModel;
