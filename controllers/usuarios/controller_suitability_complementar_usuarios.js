// controllers/usuarios/controller_suitability_complementar_usuarios.js

const UsuariosSuitabilityComplementarModel = require('../../models/usuarios/model_suitability_complementar_usuarios');
const logger = require('../../logger');

class UsuariosSuitabilityComplementarController {

    // Endpoint para buscar suitability de um usuário
    static async getSuitabilityComplementar(req, res) {
        const usuarioId = req.params.id;
        logger.info(`Tentativa de busca de suitability complementar para usuário com ID: ${usuarioId}`);

        try {
            const suitability = await UsuariosSuitabilityComplementarModel.suitabilityComplementarUsuario(usuarioId);
            if (suitability.length > 0) {
                logger.info(`Suitability complementar encontrado para o usuário com ID: ${usuarioId}`);
            } else {
                logger.info(`Nenhum suitability complementar encontrado para o usuário com ID: ${usuarioId}`);
            }
            res.json(suitability);
        } catch (error) {
            logger.error(`Erro ao buscar suitability complementar para o usuário com ID: ${usuarioId}`, error);
            res.status(500).json({ error: 'Erro ao buscar suitability complementar do usuário' });
        }
    }
}

module.exports = UsuariosSuitabilityComplementarController;

