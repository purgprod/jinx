// models/rotinas/model_poppy_atualizar_emblemas_usuarios.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarEmblemasUsuariosModel = {
    async atualizarEmblemas(atualizarEmblemas, usuario_id, conn) {
        const sqlQuery = 'UPDATE carteiras SET emblemas = ? WHERE usuario_id = ?';

        if (conn) {
            const [results] = await conn.execute(sqlQuery, [atualizarEmblemas, usuario_id]);
            logger.info(`Cliente ${usuario_id} teve o emblemas atualizado para ${atualizarEmblemas}`);
            return results;
        }

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [atualizarEmblemas, usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao atualizar emblemas do cliente:', error);
                    reject(new Error('Erro ao atualizar emblemas do cliente'));
                } else {
                    logger.info(`Cliente ${usuario_id} teve o emblemas atualizado para ${atualizarEmblemas}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = AtualizarEmblemasUsuariosModel;

