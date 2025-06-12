const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class UsersRendimentosModel {

    // Método para obter os depositos do usuário
    static async getRendimentos(usuarioId) {
        const query = `
            SELECT SUM(rendimento_diario) 
            FROM rendimentos 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor total de rendimentos para o usuário id: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Rendimentos encontrados para o usuário id: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return rows[0];
            } else {
                logger.warn(`Nenhum rendimento encontrado para o usuário id: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar rendimentos para o usuário id ${usuarioId}: ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    throw error;
        }
    }

}

module.exports = UsersRendimentosModel;

