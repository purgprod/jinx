const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class PlanosAssinaturasHistoricosModel {
    
	// Método para obter todos os dados de planos das assinaturas históricos do ecossistema
	static async getPlanosAssinaturasHistoricos() {
    		const query = `
    		SELECT 
        		DATE(data_criacao) as data_criacao, 
        		poppy_basic,
			poppy_pro
    		FROM planos_historico
    		GROUP BY DATE(data_criacao), poppy_basic, poppy_pro
    		ORDER BY data_criacao ASC
		`;
    	logger.info(`Recuperando dados de planos das assinaturas históricos`);
    	try {
        	const [rows] = await connection.promise().query(query);
        	return rows; // Retorna todos os dados de planos das assinaturas históricos
    		logger.info(`Resposta: ${JSON.stringify(rows)}`);
	} catch (error) {
        	logger.error(`Erro ao buscar dados de planos das assinaturas históricos: ${error.message}`);
        	logger.info(`Resposta: ${JSON.stringify(rows)}`);
		throw error;
    	}
	}
}

module.exports = PlanosAssinaturasHistoricosModel;

