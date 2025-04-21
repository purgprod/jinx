// models/rotinas/model_buscar_resultados_financeiros_sinistro.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const BuscarResultadosSinistroModel = {
    /**
     * Busca resultados financeiros com base em critérios de sinistro
     * @returns {Promise<Object[]>} Lista de resultados financeiros
     */
    getResultadosSinistro: async () => {
        const sqlQuery = `SELECT id_resultado, flag_sinistro, data_sinistro
        FROM resultados_financeiros
        WHERE status_ativo = 1;`;

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar resultados financeiros em sinistro:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    reject(new Error('Erro ao buscar resultados financeiros em sinistro'));
                } else {
                    logger.info(`Resultados encontrados: ${JSON.stringify(results)}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarResultadosSinistroModel;

