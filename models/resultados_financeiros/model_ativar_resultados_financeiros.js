// models/resultados_financeiros/model_ativar_resultados_financeiros.js
const connection = require('../../database/database_purg');
const logger = require('../../logger'); // Importa o logger

const ResultadosFinanceirosAtivarModel = {

    async ativarResultado(id) {
        const sqlQuery = `UPDATE resultados_financeiros SET status_ativo = 1 WHERE id_resultado = ?`;
        logger.info(`Iniciando ativação de resultado financeiro com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao ativar resultado financeiro com ID: ${id} - ${error.message}`);
		    reject(error);
                } else {
                    if (results.affectedRows > 0) {
                        logger.info(`Resultado financeiro com ID: ${id} ativado com sucesso.`);
		    } else {
                        logger.warn(`Nenhum resultado financeiro foi ativado para o ID: ${id}. Verifique se este ID existe.`);                    }
                    resolve(results);
                }
            });
        });
    }
};

module.exports = ResultadosFinanceirosAtivarModel;

