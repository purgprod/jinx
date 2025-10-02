// models/rotinas/model_atualizar_ultima_execucao.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const RotinasAtualizarModel = {
    async atualizarUltimaExecucao(rotinaId) {
        const sqlQuery = `UPDATE rotinas 
		SET ultima_execucao = CURRENT_TIMESTAMP 
		WHERE id = ?;
	`;
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [rotinaId], (error, results) => {
                if (error) {
                    logger.error('Erro ao atualizar última execução:', error);
                    reject(new Error('Erro ao atualizar última execução'));
                } else {
                    logger.info(`Última execução atualizada com sucesso para a rotina ${rotinaId}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = RotinasAtualizarModel;

