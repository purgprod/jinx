// models/emblemas/model_buscar_pagamento_emblemas_total.js

const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class EmblemasTotalModel {
    
	// Método para obter o total de emblemas do ecossistema
	static async getEmblemasTotal(usuarioId) {
    		const query = `
    		SELECT 
        		SUM(emblemas) as emblemas
    		FROM carteiras
    		WHERE usuario_id != ?
		`;
    	logger.info(`Recuperando dados de emblemas totais para o ecossistema`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; // Retorna todos os dados de pagamento das assinaturas total
    		logger.info(`Resposta: ${JSON.stringify(rows)}`);
	} catch (error) {
        	logger.error(`Erro ao buscar dados de emblemas totais para o ecossistema: ${error.message}`);
        	logger.info(`Resposta: ${JSON.stringify(rows)}`);
		throw error;
    	}
	}
}

module.exports = EmblemasTotalModel;

