// controllers/ecossistema/controller_dadosfinanceiroshistoricos_purg.js

const PurgDadosFinanceirosHistoricosModel = require('../../models/ecossistema/model_dadosfinanceiroshistoricos_purg');
const logger = require('../../logger');

class PurgDadosFinanceirosHistoricosController {


// Endpoint para obter todos os dados de valor de carteira históricos
	static async getDadosFinanceirosHistoricos(req, res) {
	    const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await PurgDadosFinanceirosHistoricosModel.getDadosFinanceirosHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de valor de carteira históricos para o usuário ID: ${usuarioId} - ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de valor de carteira históricos.' });
    		}
	}
}

module.exports = PurgDadosFinanceirosHistoricosController;

