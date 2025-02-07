// controllers/usuarios/controller_suitability_usuarios.js

const UsuariosSuitabilityModel = require('../../models/usuarios/model_suitability_usuarios');
const logger = require('../../logger');

class UsuariosSuitabilityController {

    // Endpoint para buscar suitability de um usuário
    static async getSuitability(req, res) {
        const usuarioId = req.params.id;
        logger.info(`Tentativa de busca de suitability para usuário com ID: ${usuarioId}`);

        try {
            const suitability = await UsuariosSuitabilityModel.suitabilityUsuario(usuarioId);
            if (suitability.length > 0) {
                logger.info(`Suitability encontrado para o usuário com ID: ${usuarioId}`);
            } else {
                logger.info(`Nenhum suitability encontrado para o usuário com ID: ${usuarioId}`);
            }
            res.json(suitability);
        } catch (error) {
            logger.error(`Erro ao buscar suitability para o usuário com ID: ${usuarioId}`, error);
            res.status(500).json({ error: 'Erro ao buscar suitability do usuário' });
        }
    }
}

module.exports = UsuariosSuitabilityController;

