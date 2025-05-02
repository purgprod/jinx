// models/rotinas/model_buscar_resultados_financeiros.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const BuscarResultadosFinanceirosModel = {
    async getResultadosFinanceiros() {
        const sqlQuery = `SELECT id_resultado, vencimento
	FROM resultados_financeiros
	WHERE status_ativo = 1
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar resultados financeiros:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(new Error('Erro ao buscar resultados financeiros'));
                } else {
                    resolve(results);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarResultadosFinanceirosModel;

