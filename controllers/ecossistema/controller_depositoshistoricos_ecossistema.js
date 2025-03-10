// controllers/ecossistema/controller_depositoshistoricos_ecossistema.js

const EcossistemaDepositosHistoricosModel = require('../../models/ecossistema/model_depositoshistoricos_ecossistema');
const logger = require('../../logger');

class EcossistemaDepositosHistoricosController {


// Endpoint para obter todos os dados de depositos históricos do ecossistema
	static async getDepositosHistoricos(req, res) {
	    const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await EcossistemaDepositosHistoricosModel.getDepositosHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de depositos históricos para o ecossistema: ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de depositos históricos.' });
    		}
	}
}

module.exports = EcossistemaDepositosHistoricosController;

