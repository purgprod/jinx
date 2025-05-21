// controllers/usuarios/controller_sinistro_usuario.js

const PerfilSinistroModel = require('../../models/usuarios/model_buscar_sinistro');
const logger = require('../../logger');

class PerfilSinistroController {

    // Endpoint para obter o sinistro completo dos usuários
    static async getSinistro(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosSinistro = await PerfilSinistroModel.obterSinistroUsuario(usuarioId);
            if (dadosSinistro) {
                res.status(200).json(dadosSinistro);
            } else {
                res.status(404).json({ message: 'Nenhum dado de sinistro encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os sinistro para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os sinistro.' });
        }
    }

}

module.exports = PerfilSinistroController;

