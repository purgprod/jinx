const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class UsersSaldosModel {

    // Método para obter os saldos do usuário
    static async getSaldos(usuarioId) {
        const query = `
            SELECT saldo 
            FROM carteiras 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor de saldo para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Saldos encontrados para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return rows[0];
            } else {
                logger.warn(`Nenhum saldo encontrado para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar saldos para o usuário com ID: ${usuarioId} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
            throw error;
        }
    }

}

module.exports = UsersSaldosModel;
