// models/depositos/model_deposito_rejeitar.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const RejeitarDepositoModel = {
    /**
     * Marca o depósito como Rejeitado com o motivo registrado.
     * Usado quando o CPF do pagador não corresponde ao CPF cadastrado.
     *
     * @param {string} txid   - txid da cobrança Pix
     * @param {string} motivo - Motivo da rejeição para auditoria
     */
    async rejeitarPorTxid(txid, motivo) {
        const query = `
            UPDATE depositos
            SET
                status_deposito = 'Cancelado',
                motivo          = ?
            WHERE txid = ?
              AND status_deposito = 'Analisando';
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [motivo, txid], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao rejeitar depósito txid=${txid}:`, error);
                    return reject(new Error('Erro ao rejeitar depósito.'));
                }
                resolve(results);
            });
        });
    }
};

module.exports = RejeitarDepositoModel;
