// models/resultados_financeiros/model_inativar_resultados_financeiros.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger'); // Importa o logger

const ResultadosFinanceirosInativarModel = {

    async inativarResultado(id) {
        const sqlQuery = `UPDATE resultados_financeiros SET status_ativo = 0 WHERE id_resultado = ?`;
        logger.info(`Iniciando inativação de resultado financeiro com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inativar resultado financeiro com ID: ${id} - ${error.message}`);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(error);
                } else {
                    if (results.affectedRows > 0) {
                        logger.info(`Resultado financeiro com ID: ${id} inativado com sucesso.`);
                    } else {
                        logger.warn(`Nenhum resultado financeiro foi inativado para o ID: ${id}. Verifique se este ID existe.`);
                    }
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = ResultadosFinanceirosInativarModel;

