// models/endpoints/model_saque_buscar_token.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarTokensCarteirasModel = {
    async getTokensCarteiras(usuario_id) {
        const sqlQuery = `
            SELECT ut.token_id, ut.quantidade_tokens, t.risco
            FROM usuario_tokens ut
            INNER JOIN tokens t ON ut.token_id = t.id_token
            WHERE ut.usuario_id = ?
        `
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
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

