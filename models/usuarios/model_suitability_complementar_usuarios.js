const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

class UsersSuitabilityComplementarModel {

    // Método para buscar suitability complementar associado a um usuário
    static async suitabilityComplementarUsuario(usuarioId) {
        const query = `
            SELECT *
            FROM suitability_complementar
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando suitability complementar para o usuário com ID: ${usuarioId}`);

        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Suitability complementar encontrado para o usuário com ID: ${usuarioId}`);
		logger.info(`Resposta: ${JSON.stringify(rows)}`);
            } else {
                logger.warn(`Nenhum suitability complementar encontrado para o usuário com ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    }
            return rows;
        } catch (error) {
            logger.error(`Erro ao buscar suitability complementar para o usuário com ID: ${usuarioId} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    throw error;
        }
    }
}

module.exports = UsersSuitabilityComplementarModel;

