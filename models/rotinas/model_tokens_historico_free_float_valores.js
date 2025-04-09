const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const TokensHistoricoFreeFloatValoresModel = {
    /**
     * Busca os valores de free float para um token específico
     * @param {Number} idToken - ID do token
     * @returns {Promise<Object>} Uma promessa que resolve com os valores do token
     */
    async getValoresByTokenId(idToken) {
        const query = `
            SELECT 
                t.quantidade_tokens AS total_tokens,
                t.quantidade_tokens - (SELECT u.quantidade_tokens 
                                    FROM usuario_tokens u 
                                    WHERE u.token_id = t.id_token 
                                    AND u.usuario_id = 1) AS free_float_tokens
            FROM tokens t
            WHERE t.id_token = ?;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [idToken], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar os valores de free float para o token ${idToken}:`, error);
                    reject(new Error('Erro ao buscar valores do token'));
                } else {
                    logger.info(`Resultado da consulta para token ${idToken}: ${JSON.stringify(results)}`);
                    resolve(results[0] || null);
                }
            });
        });
    }
};

module.exports = TokensHistoricoFreeFloatValoresModel;

