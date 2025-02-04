// controllers/usuarios/controller_inativar_usuarios.js

const UsuariosInativarModel = require('../../models/usuarios/model_inativar_usuarios');
const logger = require('../../logger');

class UsuariosInativarController {

    // Endpoint para inativar um usuário
    static async inativarUsuario(req, res) {
        const id = req.params.id;

        try {
            await UsuariosInativarModel.inativarUsuario(id);
            res.status(200).json({ message: 'Usuário inativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao inativar o usuário:', error);
            res.status(500).json({ error: 'Erro ao inativar o usuário' });
        }
    }
}

module.exports = UsuariosInativarController;

