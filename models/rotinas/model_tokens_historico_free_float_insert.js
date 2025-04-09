const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const TokensHistoricoFreeFloatInsertModel = {
    /**
     * Insere um novo registro histórico de free float para um token
     * @param {Object} params - Parâmetros de insert
     * @param {Number} params.token_id - ID do token
     * @param {Number} params.token_ipo - Quantidade de tokens do token
     * @param {Number} params.token_freefloat - Quantidade de tokens free float
     * @returns {Promise<Object>} Uma promessa que resolve com o resultado do insert
     */
    async insertHistorico(params) {
        const query = `
            INSERT INTO tokens_historico (
                data,
                token_id,
                token_ipo,
                token_freefloat
            ) VALUES (?, ?, ?, ?);
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [
                params.data,
                params.token_id,
                params.token_ipo,
                params.token_freefloat
            ], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inserir histórico para token ${params.token_id}:`, error);
                    reject(new Error('Erro ao inserir histórico do token'));
                } else {
                    logger.info(`Histórico inserido com sucesso para token ${params.token_id}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = TokensHistoricoFreeFloatInsertModel;

