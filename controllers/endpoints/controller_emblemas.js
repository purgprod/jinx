// controllers/endpoint/controller_emblemas.js

const EmblemasModel = require('../../models/endpoints/model_emblemas');
const logger = require('../../logger');

class EmblemasController {

   // Endpoint para obter o emblemas total do usuário
    static async getEmblemas(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosEmblemas = await EmblemasModel.getEmblemas(usuarioId);
            if (dadosEmblemas) {
                res.status(200).json(dadosEmblemas);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de emblemas encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os emblemas para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os emblemas.' });
        }
    }

}

module.exports = EmblemasController;

