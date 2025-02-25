const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class PurgDadosFinanceirosHistoricosModel {
    
	// Método para obter todos os dados de valor de carteira históricos de um usuário
	static async getDadosFinanceirosHistoricos(usuarioId) {
    		const query = `
        	SELECT data_criacao, carteira_dia 
        	FROM usuarios_dados_financeiros_diarios 
        	WHERE usuario_id = ? 
        	ORDER BY data_criacao ASC
    		`;
    	logger.info(`Recuperando dados de valor da carteira históricos para o ecossistema`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; // Retorna todos os dados financeiros históricos
    		logger.info(`Resposta: ${JSON.stringify(rows)}`);
	} catch (error) {
        	logger.error(`Erro ao buscar dados de valor da carteira históricos para o ecossistema: ${error.message}`);
        	logger.info(`Resposta: ${JSON.stringify(rows)}`);
		throw error;
    	}
	}
}

module.exports = PurgDadosFinanceirosHistoricosModel;

