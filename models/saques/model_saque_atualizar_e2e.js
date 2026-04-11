// models/saques/model_saque_atualizar_e2e.js
// Grava o endToEndId do Pix enviado e muda o status para "Processando".
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarSaqueE2eModel = {
    /**
     * Após o envio do Pix via Nubank, registra o endToEndId e muda
     * o status de "Analisando" para "Processando" (aguardando confirmação webhook).
     *
     * @param {number|string} saqueId    - ID do registro na tabela saques
     * @param {string}        endToEndId - Identificador fim-a-fim retornado pelo Nubank
     */
    async atualizarE2e(saqueId, endToEndId) {
        const query = `
            UPDATE saques
            SET
                e2e_id      = ?,
                status_saque = 'Processando',
                motivo       = 'Pix enviado via Nubank. Aguardando confirmação.'
            WHERE id = ?
              AND status_saque = 'Analisando';
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [endToEndId, saqueId], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao atualizar e2e do saque ID=${saqueId}:`, error);
                    return reject(new Error('Erro ao registrar endToEndId no saque.'));
                }
                resolve(results);
            });
        });
    }
};

module.exports = AtualizarSaqueE2eModel;
