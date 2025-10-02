const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class EcossistemaTransacaoModel {

    // Método para obter os transação do ecossistema
    static async getTransacao(usuarioId) {
        const query = `
            SELECT * 
            FROM transacoes 
            WHERE usuario_id != ?
        `;
        logger.info(`Recuperando os valores de transações para o ecossitema`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Transações encontrados para o ecossistema`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return rows; // Retorna todas as transações
            } else {
                logger.warn(`Nenhuma transação encontrado para o ecossistema`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return []; // Retorna um array vazio se não houver transações
            }
        } catch (error) {
            logger.error(`Erro ao buscar transações para o ecossistema: ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
            throw error;
        }
    }

}

module.exports = EcossistemaTransacaoModel;
