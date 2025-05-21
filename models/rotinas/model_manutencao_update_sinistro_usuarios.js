// models/rotinas/model_manutencao_update_sinistro_usuarios.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const UpdateSinistroUsuariosModel = {
    async executarUpdate(sinistro, usuario_id) {
        const sqlQuery = 'UPDATE carteiras SET sinistro = ? WHERE usuario_id = ?';
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [sinistro, usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao atribuir o sinistro do cliente:', error);
                    reject(new Error('Erro ao atribuir o sinistro do cliente'));
                } else {
                    logger.info(`Cliente ${usuario_id} atribuido para o sinistro ${sinistro} com sucesso`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = UpdateSinistroUsuariosModel;

