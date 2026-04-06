const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class InvestidoModel {

    // Método para obter os investido do usuário
    static async getInvestido(usuarioId) {
        const query = `
            SELECT investido 
            FROM carteiras 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor de investido para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Investido encontrados para o usuário ID: ${usuarioId}`);
                return rows[0];
            } else {
                logger.warn(`Nenhum investido encontrado para o usuário ID: ${usuarioId}`);
                return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar investido para o usuário com ID: ${usuarioId} - ${error.message}`);
            throw error;
        }
    }

}

module.exports = InvestidoModel;
