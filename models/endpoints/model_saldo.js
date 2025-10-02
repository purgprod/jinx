const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class SaldoModel {

    // Método para obter os saldo do usuário
    static async getSaldo(usuarioId) {
        const query = `
            SELECT saldo 
            FROM carteiras 
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando os valor de saldo para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Saldo encontrados para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return rows[0];
            } else {
                logger.warn(`Nenhum saldo encontrado para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar saldo para o usuário com ID: ${usuarioId} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
            throw error;
        }
    }

}

module.exports = SaldoModel;
