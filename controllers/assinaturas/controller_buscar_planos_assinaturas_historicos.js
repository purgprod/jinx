// controllers/assinaturas/controller_buscar_planos_assinaturas_historicos.js

const PlanosAssinaturasHistoricosModel = require('../../models/assinaturas/model_buscar_planos_assinaturas_historicos');
const logger = require('../../logger');

class PlanosAssinaturasHistoricosController {


// Endpoint para obter todos os dados de planos das assinaturas históricos
	static async getPlanosAssinaturasHistoricos(req, res) {

    	try {
        	const dadosHistoricos = await PlanosAssinaturasHistoricosModel.getPlanosAssinaturasHistoricos();
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de planos das assinaturas históricos: ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de planos das assinaturas históricos.' });
    		}
	}
}

module.exports = PlanosAssinaturasHistoricosController;

