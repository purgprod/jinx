const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersSaquesModel {

    // Método para obter os saques do usuário
    static async getSaques(usuarioId) {
        const query = `
            SELECT SUM(valor_saque) 
            FROM saques 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor total de saques para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Saques encontrados para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return rows[0];
            } else {
                logger.warn(`Nenhum saque encontrado para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar saques para o usuário com ID: ${usuarioId} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    throw error;
        }
    }

}

module.exports = UsersSaquesModel;

