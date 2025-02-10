// models/resultados_financeiros/model_buscar_resultados_financeiros.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger'); // Importa o logger

const ResultadosFinanceirosBuscarModel = {
    async getResultadosFinanceiros() {
        const sqlQuery = `SELECT * FROM resultados_financeiros`;
        logger.info('Executando query para obter todos os resultados financeiros.');

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao executar query de obter resultados financeiros: ' + error.message);
                    reject(error);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                } else {
                    logger.info('Query de obter resultados financeiros executada com sucesso.');
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = ResultadosFinanceirosBuscarModel;

