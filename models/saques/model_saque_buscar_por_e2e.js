// models/saques/model_saque_buscar_por_e2e.js
// Busca um saque pelo endToEndId para processar o webhook de confirmação.
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarSaquePorE2eModel = {
    /**
     * Localiza o saque correspondente ao endToEndId informado pelo webhook do Nubank.
     *
     * @param {string} endToEndId - Identificador fim-a-fim da transação Pix
     * @returns {Object|null} Registro do saque ou null
     */
    async getSaquePorE2e(endToEndId) {
        const query = `
            SELECT id, usuario_id, valor_saque, status_saque
            FROM saques
            WHERE e2e_id = ?
            LIMIT 1;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [endToEndId], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao buscar saque por e2e_id=${endToEndId}:`, error);
                    return reject(new Error('Erro ao buscar saque por endToEndId.'));
                }
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    }
};

module.exports = BuscarSaquePorE2eModel;
