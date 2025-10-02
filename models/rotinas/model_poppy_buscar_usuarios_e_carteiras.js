// models/rotinas/model_poppy_buscar_usuarios_e_carteiras.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarUsuariosCarteirasModel = {
    async getUsuariosCarteiras() {
        const sqlQuery = `SELECT *
        FROM carteiras c
        INNER JOIN users u
        ON c.usuario_id = u.usuario_id
        WHERE u.status_ativo = 1
	AND u.usuario_id != 1
        ;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar usuários e carteiras:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    reject(new Error('Erro ao buscar saldos das carteiras'));
                } else {
                    resolve(results);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarUsuariosCarteirasModel;
