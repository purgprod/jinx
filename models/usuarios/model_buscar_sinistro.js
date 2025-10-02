// models/usuarios/model_buscar_sinistro.js

const mysql = require('mysql2');
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class BuscarSinistroUsuarioModel {

    static async obterSinistroUsuario(usuario_id) {
        const sqlQuery = `
            SELECT 
                sinistro
            FROM carteiras
            WHERE usuario_id = ?
        `;

        logger.info(`Buscando sinistro do usuário com ID: ${usuario_id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar sinistro do usuário ${usuario_id}:`, error);
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

module.exports = BuscarSinistroUsuarioModel;

