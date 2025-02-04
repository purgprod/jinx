// controllers/usuarios/controller_dadosfinanceiroshistoricos_usuarios.js

const UsuariosDadosFinanceirosHistoricosModel = require('../../models/usuarios/model_dadosfinanceiroshistoricos_usuarios');
const logger = require('../../logger');

class UsuariosDadosFinanceirosHistoricosController {


// Endpoint para obter todos os dados de valor de carteira históricos
	static async getDadosFinanceirosHistoricos(req, res) {
	    const usuarioId = req.params.id;

    	try {
        	const dadosHistoricos = await UsuariosDadosFinanceirosHistoricosModel.getDadosFinanceirosHistoricos(usuarioId);
        	res.status(200).json(dadosHistoricos);
    	} catch (error) {
        	logger.error(`Erro ao buscar dados de valor de carteira históricos para o usuário ID: ${usuarioId} - ${error.message}`);
        	res.status(500).json({ error: 'Erro ao buscar dados de valor de carteira históricos.' });
    		}
	}
}

module.exports = UsuariosDadosFinanceirosHistoricosController;

