// controllers/endpoint/controller_carteira.js

const CarteiraModel = require('../../models/endpoints/model_carteira');
const logger = require('../../logger');

class CarteiraController {

   // Endpoint para obter os dados de carteira do usuário
    static async getCarteira(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosCarteira = await CarteiraModel.getCarteira(usuarioId);
            if (dadosCarteira) {
                res.status(200).json(dadosCarteira);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de carteira encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os carteira para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os carteira.' });
        }
    }

}

module.exports = CarteiraController;

