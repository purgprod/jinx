const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

class AtualizarSuitabilityModel {
    static async updateSuitability(suitability, usuario_id) {
        const sqlQuery = `
            UPDATE users
            SET suitability = ?
            WHERE usuario_id = ?
        `;

        const values = [suitability, usuario_id];

        logger.info(`Executando update no suitability para usuário com ID: ${usuario_id}`);
        logger.info(`Dados a serem enviados: ${JSON.stringify({ suitability, usuario_id })}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, values, (error, results) => {
                if (error) {
                    logger.error(`Erro ao atualizar o suitability para o usuário ${usuario_id}: ${error.message}`);
                    reject(error);
                } else {
                    logger.info(`Suitability do usuário ${usuario_id} atualizado com sucesso`);
                    resolve(results);
                }
            });
        });
    }
}

module.exports = AtualizarSuitabilityModel;

