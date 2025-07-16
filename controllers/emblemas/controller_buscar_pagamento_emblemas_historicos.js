// controllers/emblemas/controller_buscar_pagamento_emblemas_historicos.js

const PagamentosEmblemasHistoricosModel = require('../../models/emblemas/model_buscar_pagamento_emblemas_historicos');
const logger = require('../../logger');

class PagamentosEmblemasHistoricosController {


// Endpoint para obter todos os dados de pagamento das emblemas históricos
	static async getPagamentosEmblemasHistoricos(req, res) {
	    const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await PagamentosEmblemasHistoricosModel.getPagamentosEmblemasHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de pagamento dos emblemas históricos: ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de pagamento dos emblemas históricos.' });
    		}
	}
}

module.exports = PagamentosEmblemasHistoricosController;

