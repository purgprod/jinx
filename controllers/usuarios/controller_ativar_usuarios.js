// controllers/usuarios/controller_ativar_usuarios.js

const UsuariosAtivarModel = require('../../models/usuarios/model_ativar_usuarios');
const logger = require('../../logger');

class UsuariosAtivarController {

    // Endpoint para ativar um usuário
    static async ativarUsuario(req, res) {
        const id = req.params.id;

        try {
            await UsuariosAtivarModel.ativarUsuario(id);
            res.status(200).json({ message: 'Usuário ativado com sucesso' });
	} catch (error) {
            logger.error('Erro ao ativar o usuário:', error);
            res.status(500).json({ error: 'Erro ao ativar o usuário' });
        }
    }
}

module.exports = UsuariosAtivarController;

