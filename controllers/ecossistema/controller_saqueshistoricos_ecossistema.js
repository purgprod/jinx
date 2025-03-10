// controllers/ecossistema/controller_saqueshistoricos_ecossistema.js

const EcossistemaSaquesHistoricosModel = require('../../models/ecossistema/model_saqueshistoricos_ecossistema');
const logger = require('../../logger');

class EcossistemaSaquesHistoricosController {


// Endpoint para obter todos os dados de saques históricos do ecossistema
	static async getSaquesHistoricos(req, res) {
	    const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await EcossistemaSaquesHistoricosModel.getSaquesHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de saques históricos para o ecossistema: ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de saques históricos.' });
    		}
	}
}

module.exports = EcossistemaSaquesHistoricosController;

