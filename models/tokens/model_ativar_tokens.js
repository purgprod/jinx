// models/tokens/model_ativar_tokens.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const TokensAtivarModel = {

    async ativarToken(id) {
        const sqlQuery = `UPDATE tokens SET status_ativo = 1 WHERE id_resultado = ?`;
        logger.info(`Iniciando ativação de token com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao ativar token com ID: ${id} - ${error.message}`);
                    reject(new Error(`Erro ao ativar token com ID: ${id}`));
                } else {
                    if (results.affectedRows > 0) {
                        logger.info(`Token com ID: ${id} ativado com sucesso.`);
			logger.info(`Resposta: ${JSON.stringify(results)}`);
                    } else {
                        logger.warn(`Nenhum token foi ativado para o ID: ${id}. Verifique se este ID existe.`);
                        logger.info(`Resposta: ${JSON.stringify(results)}`);
		    }
                    resolve(results);
                }
            });
        });
    }
};

module.exports = TokensAtivarModel;

