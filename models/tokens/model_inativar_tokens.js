// models/tokens/model_inativar_tokens.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const TokensInativarModel = {

    async inativarToken(id) {
        const sqlQuery = `UPDATE tokens SET status_ativo = 0 WHERE id_resultado = ?`;
        logger.info(`Iniciando inativação de Token com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inativar token com ID: ${id} - ${error.message}`);
                    reject(new Error(`Erro ao inativar token com ID: ${id}`));
		} else {
                    if (results.affectedRows > 0) {
                        logger.info(`Token com ID: ${id} inativado com sucesso.`);
		    } else {
                        logger.warn(`Nenhum token foi inativado para o ID: ${id}. Verifique se este ID existe.`);
		    }
                    resolve(results);
                }
            });
        });
    }
};

module.exports = TokensInativarModel;

