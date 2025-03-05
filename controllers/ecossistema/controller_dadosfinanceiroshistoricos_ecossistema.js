// controllers/ecossistema/controller_dadosfinanceiroshistoricos_ecossistema.js

const EcossistemaDadosFinanceirosHistoricosModel = require('../../models/ecossistema/model_dadosfinanceiroshistoricos_ecossistema');
const logger = require('../../logger');

class EcossistemaDadosFinanceirosHistoricosController {


// Endpoint para obter todos os dados de valor de carteira históricos
	static async getDadosFinanceirosHistoricos(req, res) {
	    const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await EcossistemaDadosFinanceirosHistoricosModel.getDadosFinanceirosHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de valor de carteira históricos para o usuário ID: ${usuarioId} - ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de valor de carteira históricos.' });
    		}
	}
}

module.exports = EcossistemaDadosFinanceirosHistoricosController;

