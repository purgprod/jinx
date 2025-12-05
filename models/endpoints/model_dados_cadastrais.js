const mysql = require('mysql2');
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class DadosCadastraisModel {

    // Método para obter os dados cadastrais do usuário
    static async getDadosCadastrais(usuarioId) {
        const query = `
            SELECT * 
            FROM users 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor dos dados cadastrais para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Dados cadastrais encontrados para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return rows[0];
            } else {
                logger.warn(`Nenhum dados cadastral encontrado para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar dados cadastrais para o usuário com ID: ${usuarioId} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
            throw error;
        }
    }

}

module.exports = DadosCadastraisModel;
