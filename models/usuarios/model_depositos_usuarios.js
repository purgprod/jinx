const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersDepositosModel {

    // Método para obter os depositos do usuário
    static async getDepositos(usuarioId) {
        const query = `
            SELECT SUM(valor_deposito) 
            FROM depositos 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor total de depositos para o usuário id: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Depositos encontrados para o usuário id: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return rows[0];
            } else {
                logger.warn(`Nenhum deposito encontrado para o usuário id: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar depositos para o usuário id ${usuarioId}: ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    throw error;
        }
    }

}

module.exports = UsersDepositosModel;

