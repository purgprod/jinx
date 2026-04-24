// models/saques/model_saque_falhar.js
// Marca o saque como "Falhou" e reverte o saldo do usuário quando o Nubank
// informa que o envio do Pix não foi concluído.
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const FalharSaqueModel = {
    /**
     * Transiciona o status de "Processando" para "Falhou" com o motivo fornecido.
     *
     * @param {string} endToEndId - Identificador fim-a-fim da transação que falhou
     * @param {string} motivo     - Motivo da falha informado pelo Nubank
     */
    async falharPorE2e(endToEndId, motivo, conn) {
        const query = `
            UPDATE saques
            SET
                status_saque = 'Cancelado',
                motivo       = ?
            WHERE e2e_id = ?
              AND status_saque = 'Processando';
        `;

        if (conn) {
            const [results] = await conn.execute(query, [motivo, endToEndId]);
            return results;
        }

        return new Promise((resolve, reject) => {
            connection.query(query, [motivo, endToEndId], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao marcar saque como Falhou. e2e=${endToEndId}:`, error);
                    return reject(new Error('Erro ao registrar falha no saque.'));
                }
                resolve(results);
            });
        });
    }
};

module.exports = FalharSaqueModel;
