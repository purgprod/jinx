// models/rotinas/model_manutencao_update_ranking_usuarios.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const UpdateRankingUsuariosModel = {
    async executarUpdate(ranking, usuario_id) {
        const sqlQuery = 'UPDATE carteiras SET ranking = ? WHERE usuario_id = ?';
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [ranking, usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao atribuir o ranking do cliente:', error);
                    reject(new Error('Erro ao atribuir o ranking do cliente'));
                } else {
                    logger.info(`Cliente ${usuario_id} atribuido para o ranking ${ranking} com sucesso`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = UpdateRankingUsuariosModel;

