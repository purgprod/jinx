// models/tokens/model_buscar_tokens.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const TokensBuscarModel = {
    async getTokens() {
        const sqlQuery = 'SELECT * FROM tokens;'
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar tokens:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(new Error('Erro ao buscar tokens'));
                } else {
                    resolve(results);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = TokensBuscarModel;

