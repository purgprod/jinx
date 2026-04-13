const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class EmblemasModel {

    // Método para obter o valor total investido em Pins de Emblema do usuário
    // (calculado dinamicamente de usuario_tokens — a coluna 'emblemas' não existe em carteiras)
    static async getEmblemas(usuarioId) {
        const query = `
            SELECT COALESCE(SUM(ut.quantidade_tokens * 0.01), 0) AS emblemas
            FROM usuario_tokens ut
            INNER JOIN tokens t ON ut.token_id = t.id_token
            WHERE ut.usuario_id = ?
              AND t.risco = 'EMB'
              AND ut.quantidade_tokens > 0
        `;
        logger.info(`Recuperando valor de Pins de Emblema para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            logger.info(`Emblemas encontrados para o usuário ID: ${usuarioId}`);
            return rows[0];
        } catch (error) {
            logger.error(`Erro ao buscar emblemas para o usuário com ID: ${usuarioId} - ${error.message}`);
            throw error;
        }
    }

}

module.exports = EmblemasModel;
