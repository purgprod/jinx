// models/rotinas/model_manutencao_update_liga_usuarios.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const UpdateLigaUsuariosModel = {
    async executarUpdate(liga, usuario_id) {
        const sqlQuery = 'UPDATE carteiras SET liga = ? WHERE usuario_id = ?';
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [liga, usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao atribuir a liga do cliente:', error);
                    reject(new Error('Erro ao atribuir a liga do cliente'));
                } else {
                    logger.info(`Cliente ${usuario_id} atribuído para a liga ${liga} com sucesso`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = UpdateLigaUsuariosModel;
