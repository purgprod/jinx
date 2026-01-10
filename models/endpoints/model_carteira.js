const mysql = require('mysql2');
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class CarteiraModel {

    // Método para obter os dados de carteira do usuário
    static async getCarteira(usuarioId) {
        const query = `
            SELECT * 
            FROM carteiras 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor de carteira para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Carteira encontrados para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return rows[0];
            } else {
                logger.warn(`Nenhum carteira encontrado para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar carteira para o usuário com ID: ${usuarioId} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
            throw error;
        }
    }

}

module.exports = CarteiraModel;
