// models/rotinas/model_manutencao_buscar_planos.js
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

const BuscarPlanosModel = {
    async getPlanos() {
        const sqlQuery = `SELECT assinatura
	FROM users
	WHERE status_ativo = 1
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar planos dos usuários:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(new Error('Erro ao buscar planos dos usuários'));
                } else {
                    resolve(results);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarPlanosModel;

