// controllers/emblemas/controller_buscar_total_emblemas_historicos_ecossistema.js.js

const PurgEmblemasHistoricosModel = require('../../models/emblemas/model_buscar_total_emblemas_historicos.js');
const logger = require('../../logger');

class PurgEmblemasHistoricosController {


// Endpoint para obter todos os dados de valor de carteira históricos
	static async getEmblemasHistoricos(req, res) {
	    const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await PurgEmblemasHistoricosModel.getEmblemasHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de emblemas de carteira históricos para o usuário ID: ${usuarioId} - ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de valor de carteira históricos.' });
    		}
	}
}

module.exports = PurgEmblemasHistoricosController;

