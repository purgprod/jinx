const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class PagamentosAssinaturasTotalModel {
    
	// Método para obter todos os dados de pagamento das assinaturas total do ecossistema
	static async getPagamentosAssinaturasTotal(usuarioId) {
    		const query = `
    		SELECT 
        		SUM(pagamento_assinatura) as pagamento_assinatura
    		FROM assinatura
    		WHERE usuario_id != ?
		`;
    	logger.info(`Recuperando dados de pagamento das assinaturas total para o ecossistema`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; // Retorna todos os dados de pagamento das assinaturas total
    		logger.info(`Resposta: ${JSON.stringify(rows)}`);
	} catch (error) {
        	logger.error(`Erro ao buscar dados de pagamento das assinaturas total para o ecossistema: ${error.message}`);
        	logger.info(`Resposta: ${JSON.stringify(rows)}`);
		throw error;
    	}
	}
}

module.exports = PagamentosAssinaturasTotalModel;

