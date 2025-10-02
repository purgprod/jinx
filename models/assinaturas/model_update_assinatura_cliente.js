// models/assinaturas/model_update_assinatura_cliente.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const UpdateAssinaturaClienteModel = {

    async updateAssinatura(novaAssinatura, usuario_id) {
        const sqlQuery = `UPDATE users SET assinatura = ? WHERE usuario_id = ?`;
        logger.info(`Iniciando alteração da assinatura para ${novaAssinatura} do usuário ${usuario_id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [novaAssinatura, usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao alterar a nova assinatura para: ${novaAssinatura} - ${error.message}`);
                    reject(new Error(`Erro ao alterar a nova assnatura para o usuário: ${usuario_id}`));
		} else {
                    if (results.affectedRows > 0) {
                        logger.info(`Resposta: ${JSON.stringify(results)}`);
		    } else {
                        logger.warn(`A nova assinaturas não foi alterada ${novaAssinatura} no usuário ${usuario_id}`);
                        logger.info(`Resposta: ${JSON.stringify(results)}`);
		    }
                    resolve(results);
                }
            });
        });
    }
};

module.exports = UpdateAssinaturaClienteModel;

