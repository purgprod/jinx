// models/emblemas/model_buscar_pagamento_emblemas_total.js

const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class PagamentosEmblemasTotalModel {
    
	// Método para obter o pagamento total de emblemas do ecossistema
	static async getPagamentosEmblemasTotal(usuarioId) {
    		const query = `
    		SELECT 
        		SUM(pagamento_emblemas) as pagamento_emblemas
    		FROM emblemas
    		WHERE usuario_id != ?
		`;
    	logger.info(`Recuperando dados de emblemas totais para o ecossistema`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; 
    		logger.info(`Resposta: ${JSON.stringify(rows)}`);
	} catch (error) {
        	logger.error(`Erro ao buscar dados de pagamentos totais dos emblemas para o ecossistema: ${error.message}`);
        	logger.info(`Resposta: ${JSON.stringify(rows)}`);
		throw error;
    	}
	}
}

module.exports = PagamentosEmblemasTotalModel;

