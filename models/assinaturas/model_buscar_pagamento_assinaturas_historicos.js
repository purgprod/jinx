const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class PagamentosAssinaturasHistoricosModel {
    
	// Método para obter todos os dados de pagamento das assinaturas históricos
	static async getPagamentosAssinaturasHistoricos(usuarioId) {
    		const query = `
    		SELECT 
        		DATE(data_criacao) as data_criacao, 
        		SUM(pagamento_assinatura) as pagamento_assinatura
    		FROM assinatura
    		WHERE usuario_id != ?
    		GROUP BY DATE(data_criacao)
    		ORDER BY data_criacao ASC
		`;
    	logger.info(`Recuperando dados de pagamento das assinaturas históricos`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; // Retorna todos os dados de pagamento das assinaturas históricos
	} catch (error) {
        	logger.error(`Erro ao buscar dados de pagamento das assinaturas históricos para: ${error.message}`);
		throw error;
    	}
	}
}

module.exports = PagamentosAssinaturasHistoricosModel;

