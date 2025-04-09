// models/rotinas/model_usuarios_ativos.js
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

const UsuariosModel = {
    async getActiveUsers() {
        const query = 'SELECT usuario_id FROM users WHERE status_ativo = 1';

        return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar usuários ativos:', error);
                    reject(new Error('Erro ao buscar usuários ativos: ' + error.message));
                } else {
                    logger.info(`Resultado da consulta: ${JSON.stringify(results)}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = UsuariosModel;
