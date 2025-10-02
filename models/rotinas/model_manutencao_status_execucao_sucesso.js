// models/rotinas/model_manutencao_status_execussao_sucesso.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const RotinasExecutarModel = {
    async executarRotina(rotinaId) {
        const sqlQuery = 'UPDATE rotinas SET status_execucao = ? WHERE id = ?';
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, ['SUCESSO', rotinaId], (error, results) => {
                if (error) {
                    logger.error('Erro ao executar rotina:', error);
                    reject(new Error('Erro ao executar rotina'));
                } else {
                    logger.info(`Rotina ${rotinaId} executada com sucesso`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = RotinasExecutarModel;

