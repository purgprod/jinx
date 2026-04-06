const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersSuitabilityModel {

    // Método para buscar suitability associado a um usuário
    static async suitabilityUsuario(usuarioId) {
        const query = `
            SELECT *
            FROM suitability
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando suitability para o usuário com ID: ${usuarioId}`);

        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Suitability encontrado para o usuário com ID: ${usuarioId}`);
            } else {
                logger.warn(`Nenhum suitability encontrado para o usuário com ID: ${usuarioId}`);
	    }
            return rows;
        } catch (error) {
            logger.error(`Erro ao buscar suitability para o usuário com ID: ${usuarioId} - ${error.message}`);
	    throw error;
        }
    }
}

module.exports = UsersSuitabilityModel;

