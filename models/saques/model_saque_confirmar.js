// models/saques/model_saque_confirmar.js
// Marca o saque como "Executado" após confirmação do webhook Nubank.
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const ConfirmarSaqueModel = {
    /**
     * Transiciona o status de "Processando" para "Executado" após o Nubank
     * confirmar que o Pix foi entregue ao destinatário.
     *
     * @param {string} endToEndId - Identificador fim-a-fim da transação confirmada
     */
    async confirmarPorE2e(endToEndId) {
        const query = `
            UPDATE saques
            SET
                status_saque = 'Executado',
                motivo       = 'Pix confirmado pelo Nubank.'
            WHERE e2e_id = ?
              AND status_saque = 'Processando';
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [endToEndId], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao confirmar saque e2e=${endToEndId}:`, error);
                    return reject(new Error('Erro ao confirmar saque.'));
                }
                resolve(results);
            });
        });
    }
};

module.exports = ConfirmarSaqueModel;
