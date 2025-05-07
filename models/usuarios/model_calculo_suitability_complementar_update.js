const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

class AtualizarSuitabilityComplementarModel {
    static async updateSuitabilityComplementar(suitability_complementar, usuario_id) {
        const sqlQuery = `
            UPDATE users
            SET suitability_complementar = ?
            WHERE usuario_id = ?
        `;

        const values = [suitability_complementar, usuario_id];

        logger.info(`Executando update no suitability complementar para usuário com ID: ${usuario_id}`);
        logger.info(`Dados a serem enviados: ${JSON.stringify({ suitability_complementar, usuario_id })}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, values, (error, results) => {
                if (error) {
                    logger.error(`Erro ao atualizar o suitability complementar para o usuário ${usuario_id}: ${error.message}`);
                    reject(error);
                } else {
                    logger.info(`Suitability complementar do usuário ${usuario_id} atualizado com sucesso`);
                    resolve(results);
                }
            });
        });
    }
}

module.exports = AtualizarSuitabilityComplementarModel;

