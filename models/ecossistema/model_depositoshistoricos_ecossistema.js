const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class EcossistemaDepositosHistoricosModel {
    
	// Método para obter todos os dados de depositos históricos do ecossistema
	static async getDepositosHistoricos(usuarioId) {
    		const query = `
        	SELECT data_criacao, valor_deposito
        	FROM depositos 
        	WHERE usuario_id != ? 
        	ORDER BY data_criacao ASC
    		`;
    	logger.info(`Recuperando dados de depositos históricos para o ecossistema`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; // Retorna todos os dados de depositos históricos
    		logger.info(`Resposta: ${JSON.stringify(rows)}`);
	} catch (error) {
        	logger.error(`Erro ao buscar dados de depositos históricos para o ecossistema: ${error.message}`);
        	logger.info(`Resposta: ${JSON.stringify(rows)}`);
		throw error;
    	}
	}
}

module.exports = EcossistemaDepositosHistoricosModel;

