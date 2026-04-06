// models/assinaturas/model_update_assinatura_aceite_suitability.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const UpdateAssinaturaAceiteSuitabilityModel = {

    async updateAceiteSuitability(aceiteSuitability, usuario_id) {
        const sqlQuery = `UPDATE users SET aceite_alteracao_suitability_poppy = ? WHERE usuario_id = ?`;
        logger.info(`Iniciando alteração do aceite do novo suitability para ${aceiteSuitability} do usuário ${usuario_id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [aceiteSuitability, usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao alterar o novo aceite de suitability para: ${aceiteSuitability} - ${error.message}`);
                    reject(new Error(`Erro ao alterar o novo aceite de suitability para o usuário: ${usuario_id}`));
		} else {
                    if (results.affectedRows > 0) {
		    } else {
                        logger.warn(`O novo aceite de suitability foi alterada para ${aceiteSuitability} no usuário ${usuario_id}`);
		    }
                    resolve(results);
                }
            });
        });
    }
};

module.exports = UpdateAssinaturaAceiteSuitabilityModel;

