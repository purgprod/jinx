const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class EcossistemaSaquesHistoricosModel {
    
	// Método para obter todos os dados de saques históricos do ecossistema
	static async getSaquesHistoricos(usuarioId) {
    		const query = `
        	SELECT data_criacao, valor_saque 
        	FROM saques 
        	WHERE usuario_id != ? 
        	ORDER BY data_criacao ASC
    		`;
    	logger.info(`Recuperando dados de saques históricos para o ecossistema`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; // Retorna todos os dados de saques históricos
    		logger.info(`Resposta: ${JSON.stringify(rows)}`);
	} catch (error) {
        	logger.error(`Erro ao buscar dados de saques históricos para o ecossistema: ${error.message}`);
        	logger.info(`Resposta: ${JSON.stringify(rows)}`);
		throw error;
    	}
	}
}

module.exports = EcossistemaSaquesHistoricosModel;

