// controllers/purg/controller_dadosrendimentoshistoricos_purg.js

const PurgDadosRendimentosHistoricosModel = require('../../models/ecossistema/model_dadosrendimentoshistoricos_purg');
const logger = require('../../logger');

class PurgDadosRendimentosHistoricosController {


// Endpoint para obter todos os dados de rendimentos históricos
	static async getDadosRendimentosHistoricos(req, res) {
    	const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await PurgDadosRendimentosHistoricosModel.getDadosRendimentosHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de rendimentos históricos para a Purg: ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de rendimentos históricos.' });    }
	}

}

module.exports = PurgDadosRendimentosHistoricosController;

