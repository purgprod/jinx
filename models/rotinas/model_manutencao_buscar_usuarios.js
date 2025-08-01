// models/rotinas/model_manutencao_buscar_usuarios.js
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

const BuscarUsuariosModel = {
    async getUsuarios() {
        const sqlQuery = `SELECT *
	FROM users
	WHERE status_ativo = 1
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar dados dos usuarios:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(new Error('Erro ao buscar dados dos usuarios'));
                } else {
                    resolve(results);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarUsuariosModel;

