const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class UsersDadosRendimentosHistoricosModel {
    
	// Método para obter todos os dados de rendimentos históricos de um usuário
	static async getDadosRendimentosHistoricos(usuarioId) {
    		const query = `
        	SELECT data_criacao, rendimento_dia
        	FROM usuarios_dados_financeiros_diarios
        	WHERE usuario_id = ?
        	ORDER BY data_criacao ASC
    	`;
    	logger.info(`Recuperando dados de rendimentos históricos para o usuário ID: ${usuarioId}`);

    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);        return rows; // Retorna todos os dados financeiros históricos
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de rendimentos  históricos para o usuário ID: ${usuarioId} - ${error.message}`);
        	throw error;
    		}
	}
}

module.exports = UsersDadosRendimentosHistoricosModel;

