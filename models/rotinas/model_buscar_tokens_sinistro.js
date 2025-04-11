// models/rotinas/model_buscar_rotinas.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const BuscarTokensSinistroModel = {
    async getTokensSinistro() {
        const sqlQuery = `SELECT id_token
	FROM tokens
	WHERE flag_sinistro = 1
	AND status_ativo = 1;
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar tokens em Sinistro:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(new Error('Erro ao buscar tokens em Sinistro'));
                } else {
                    resolve(results);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarTokensSinistroModel;

