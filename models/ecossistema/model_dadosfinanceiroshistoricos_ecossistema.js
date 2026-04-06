const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class EcossistemaDadosFinanceirosHistoricosModel {
    
	// Método para obter todos os dados de valor de carteira históricos de um usuário
	static async getDadosFinanceirosHistoricos(usuarioId) {
    		const query = `
        	SELECT
		  data_criacao,
		  SUM(carteira_dia) AS carteira_dia
		FROM usuarios_dados_financeiros_diarios
		WHERE usuario_id != 1
		GROUP BY data_criacao
		ORDER BY data_criacao;
    		`;
    	logger.info(`Recuperando dados de valor da carteira históricos para o ecossistema`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; // Retorna todos os dados financeiros históricos
	} catch (error) {
        	logger.error(`Erro ao buscar dados de valor da carteira históricos para o ecossistema: ${error.message}`);
		throw error;
    	}
	}
}

module.exports = EcossistemaDadosFinanceirosHistoricosModel;

