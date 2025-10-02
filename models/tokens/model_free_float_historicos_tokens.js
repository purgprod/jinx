const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersFreeFloatTokensHistoricosModel {
    // Método para obter todos os dados históricos de free float de um token
    static async getFreeFloatTokensHistoricos(tokenId) {
        const query = `
        SELECT data, token_ipo, token_freefloat 
        FROM tokens_historico 
        WHERE token_id = ? 
        ORDER BY data ASC
        `;
        logger.info(`Recuperando dados de free float históricos para o token ID: ${tokenId}`);
        
        try {
            const [rows] = await connection.promise().query(query, [tokenId]);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
            return rows;
        } catch (error) {
            logger.error(`Erro ao buscar dados de free float históricos para o token ID: ${tokenId} - ${error.message}`);
            throw error;
        }
    }
}

module.exports = UsersFreeFloatTokensHistoricosModel;

