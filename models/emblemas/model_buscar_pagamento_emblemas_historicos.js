// model/emblemas/emblemas/model_buscar_pagamento_emblemas_historicos.js

const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class PagamentosEmblemasHistoricosModel {
    
	// Método para obter o total de emblemas do ecossistema
	static async getPagamentosEmblemasHistoricos(usuarioId) {
    		const query = `
    		SELECT pagamento_emblemas, data_criacao
    		FROM emblemas
    		WHERE usuario_id != ?
		`;
    	logger.info(`Recuperando dados de pagamento dos emblemas totais para o ecossistema`);
    	try {
        	const [rows] = await connection.promise().query(query, [usuarioId]);
        	return rows; // Retorna todos os dados de pagamento das assinaturas total
	} catch (error) {
        	logger.error(`Erro ao buscar dados de pagamento dos emblemas totais para o ecossistema: ${error.message}`);
		throw error;
    	}
	}
}

module.exports = PagamentosEmblemasHistoricosModel;

