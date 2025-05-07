// controllers/usuarios/controller_perfil_suitability_completo_usuario.js

const PerfilSuitabilityCompletoModel = require('../../models/usuarios/model_buscar_suitability_completo');
const logger = require('../../logger');

class PerfilSuitabilityCompletoController {

    // Endpoint para obter o suitability completo dos usuários
    static async getSuitability(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosSuitability = await PerfilSuitabilityCompletoModel.obterSuitabilityUsuario(usuarioId);
            if (dadosSuitability) {
                res.status(200).json(dadosSuitability);
            } else {
                res.status(404).json({ message: 'Nenhum dado de suitability encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os suitability para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os suitability.' });
        }
    }

}

module.exports = PerfilSuitabilityCompletoController;

