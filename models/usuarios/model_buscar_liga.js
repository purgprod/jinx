// models/usuarios/model_buscar_liga.js

const connection = require('../../database/database_purg');
const logger = require('../../logger');

class BuscarLigaUsuarioModel {

    static async obterLigaUsuario(usuario_id) {
        const sqlQuery = `
            SELECT
                liga
            FROM carteiras
            WHERE usuario_id = ?
        `;

        logger.info(`Buscando liga do usuário com ID: ${usuario_id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar liga do usuário ${usuario_id}:`, error);
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

module.exports = BuscarLigaUsuarioModel;
