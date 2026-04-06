// models/rotinas/model_manutencao_buscar_usuarios.js
const connection = require('../../database/database_purg');
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
		    reject(new Error('Erro ao buscar dados dos usuarios'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarUsuariosModel;

