// models/rotinas/model_poppy_atualizar_flag_flag emblemas_usuarios.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarFlagEmblemasUsuariosModel = {
    async atualizarFlagEmblemas(flag_emblemas, usuario_id) {
        const sqlQuery = 'UPDATE carteiras SET flag_emblemas = ? WHERE usuario_id = ?';
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [flag_emblemas, usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao atualizar flag emblemas do cliente:', error);
                    reject(new Error('Erro ao atualizar flag emblemas do cliente'));
                } else {
                    logger.info(`Cliente ${usuario_id} teve o flag emblemas atualizado para ${flag_emblemas}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = AtualizarFlagEmblemasUsuariosModel;

