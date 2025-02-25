// controllers/usuarios/controller_dadosrendimentoshistoricos_usuarios.js

const UsuariosDadosRendimentosHistoricosModel = require('../../models/usuarios/model_dadosrendimentoshistoricos_usuarios');
const logger = require('../../logger');

class UsuariosDadosRendimentosHistoricosController {


// Endpoint para obter todos os dados de rendimentos históricos
	static async getDadosRendimentosHistoricos(req, res) {
    	const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await UsuariosDadosRendimentosHistoricosModel.getDadosRendimentosHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de rendimentos históricos para o usuário ID: ${usuarioId} - ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de rendimentos históricos.' });    }
	}

}

module.exports = UsuariosDadosRendimentosHistoricosController;

