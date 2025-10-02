// models/assinaturas/model_update_porcentagem_assinaturas.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const UpdatePorcentagemAssinaturasModel = {

    async updatePorcentagem(novoValor) {
        const sqlQuery = `UPDATE porcentagem_assinatura SET porcentagem_assinatura = ? WHERE id = 1`;
        logger.info(`Iniciando alteração da porcentagem das assinaturas para: ${novoValor}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [novoValor], (error, results) => {
                if (error) {
                    logger.error(`Erro ao alterar a porcentagem das assinaturas para: ${novoValor} - ${error.message}`);
                    reject(new Error(`Erro ao inativar token com ID: ${novoValor}`));
		} else {
                    if (results.affectedRows > 0) {
                        logger.info(`Resposta: ${JSON.stringify(results)}`);
		    } else {
                        logger.warn(`A porcentagem das assinaturas não foi alterada para o novo valor: ${novoValor}`);
                        logger.info(`Resposta: ${JSON.stringify(results)}`);
		    }
                    resolve(results);
                }
            });
        });
    }
};

module.exports = UpdatePorcentagemAssinaturasModel;

