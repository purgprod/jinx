const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class EmblemasModel {

    // Método para obter os emblemas do usuário
    static async getEmblemas(usuarioId) {
        const query = `
            SELECT emblemas 
            FROM carteiras 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor de emblemas para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Emblemas encontrados para o usuário ID: ${usuarioId}`);
                return rows[0];
            } else {
                logger.warn(`Nenhum emblemas encontrado para o usuário ID: ${usuarioId}`);
                return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar emblemas para o usuário com ID: ${usuarioId} - ${error.message}`);
            throw error;
        }
    }

}

module.exports = EmblemasModel;
