// controllers/purg/controller_dadosrendimentoshistoricos_ecossistema.js

const EcossistemaDadosRendimentosHistoricosModel = require('../../models/ecossistema/model_dadosrendimentoshistoricos_ecossistema');
const logger = require('../../logger');

class EcossistemaDadosRendimentosHistoricosController {


// Endpoint para obter todos os dados de rendimentos históricos
	static async getDadosRendimentosHistoricos(req, res) {
    	const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await EcossistemaDadosRendimentosHistoricosModel.getDadosRendimentosHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de rendimentos históricos para o Ecossistema: ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de rendimentos históricos.' });    }
	}

}

module.exports = EcossistemaDadosRendimentosHistoricosController;

