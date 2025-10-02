// models/usuarios/model_buscar_suitability_completo.js

const mysql = require('mysql2');
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class BuscarSuitabilityUsuarioModel {

    static async obterSuitabilityUsuario(usuario_id) {
        const sqlQuery = `
            SELECT 
                suitability,
                suitability_complementar
            FROM users
            WHERE usuario_id = ?
        `;

        logger.info(`Buscando respostas do usuário com ID: ${usuario_id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar respostas do usuário ${usuario_id}:`, error);
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

module.exports = BuscarSuitabilityUsuarioModel;

