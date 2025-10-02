// controllers/endpoint/controller_investido.js

const InvestidoModel = require('../../models/endpoints/model_investido');
const logger = require('../../logger');

class InvestidoController {

   // Endpoint para obter o investido total do usuário
    static async getInvestido(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosInvestido = await InvestidoModel.getInvestido(usuarioId);
            if (dadosInvestido) {
                res.status(200).json(dadosInvestido);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de investido encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os investido para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os investido.' });
        }
    }

}

module.exports = InvestidoController;

