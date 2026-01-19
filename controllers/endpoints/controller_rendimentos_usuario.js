// controllers/endpoint/controller_rendimentos_usuario.js

const RendimentosUsuarioModel = require('../../models/endpoints/model_rendimentos_usuario');
const logger = require('../../logger');

class RendimentosUsuarioController {

   // Endpoint para obter os rendimentos do usuário
    static async getRendimentosUsuario(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosRendimentosUsuario = await RendimentosUsuarioModel.getRendimentosUsuario(usuarioId);
            if (dadosRendimentosUsuario) {
                res.status(200).json(dadosRendimentosUsuario);
	    } else {
                res.status(404).json({ message: 'Nenhum rendimento encontrado para o usuário.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os rendimentos para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os dados cadastrais.' });
        }
    }

}

module.exports = RendimentosUsuarioController;

