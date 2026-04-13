// models/endpoints/model_saque_buscar_tokens_purg.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarTokensCarteirasModel = {
    async getTokensCarteiras(_usuario_id) {
        const sqlQuery = `
            SELECT token_id, quantidade_tokens
            FROM usuario_tokens
            WHERE usuario_id = 1
        `
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar tokens da carteira:', error);
                    reject(new Error('Erro ao buscar tokens da carteira'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarTokensCarteirasModel;

