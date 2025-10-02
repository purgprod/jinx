// models/rotinas/model_manutencao_buscar_carteiras.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarCarteirasModel = {
    async getCarteiras() {
        const sqlQuery = `SELECT *
	FROM carteiras
	WHERE status_ativo = 1
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar dados das carteiras:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(new Error('Erro ao buscar dados das carteiras'));
                } else {
                    resolve(results);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarCarteirasModel;

