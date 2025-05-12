// controllers/ecossistema/controller_buscar_pagamentos_assinaturas_historicos_ecossistema.js

const PagamentosAssinaturasHistoricosModel = require('../../models/assinaturas/model_buscar_pagamento_assinaturas_historicos_ecossistema');
const logger = require('../../logger');

class PagamentosAssinaturasHistoricosController {


// Endpoint para obter todos os dados de pagamento das assinaturas históricos do ecossistema
	static async getPagamentosAssinaturasHistoricos(req, res) {
	    const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await PagamentosAssinaturasHistoricosModel.getPagamentosAssinaturasHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de pagamento das assinaturas históricos para o ecossistema: ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de pagamento das assinaturas históricos.' });
    		}
	}
}

module.exports = PagamentosAssinaturasHistoricosController;

