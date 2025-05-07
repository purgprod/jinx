// models/usuarios/model_buscar_ranking.js

const mysql = require('mysql2');
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class BuscarRankingUsuarioModel {

    static async obterRankingUsuario(usuario_id) {
        const sqlQuery = `
            SELECT 
                ranking
            FROM carteiras
            WHERE usuario_id = ?
        `;

        logger.info(`Buscando ranking do usuário com ID: ${usuario_id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar ranking do usuário ${usuario_id}:`, error);
                    reject(error);
                } else {
                    if (results.length === 0) {
                        resolve({});
                    } else {
                        resolve(results[0]);
                    }
                }
            });
        });
    }
}

module.exports = BuscarRankingUsuarioModel;

