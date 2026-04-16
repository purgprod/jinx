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
                    reject(new Error('Erro ao buscar saldos das carteiras'));
                } else {
                    resolve(results);
                }
            });
        });
    },

    async getUsuarioCarteiraPorId(usuario_id) {
        const sqlQuery = `SELECT *
        FROM carteiras c
        INNER JOIN users u
        ON c.usuario_id = u.usuario_id
        WHERE u.status_ativo = 1
        AND c.usuario_id = ?
        LIMIT 1;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar usuário e carteira id=${usuario_id}:`, error);
                    reject(new Error('Erro ao buscar saldo da carteira do usuário'));
                } else {
                    resolve(results[0] || null);
                }
            });
        });
    }
};

module.exports = BuscarUsuariosCarteirasModel;
