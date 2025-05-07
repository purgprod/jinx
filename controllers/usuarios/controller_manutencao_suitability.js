// controllers/usuarios/controller_update_usuarios.js

const UsuariosUpdateModel = require('../../models/usuarios/model_update_usuarios');
const logger = require('../../logger');

class UsuariosUpdateController {

    // Endpoint para fazer update em um usuário
    static async updateUsuario(req, res) {
        const id = req.params.id;
        const data = req.body;

        // Logando os dados recebidos
        logger.info(`PUT /api/usuarios/${id}`);
        logger.info(`Body: ${JSON.stringify(data)}`); // Log dos dados que estão sendo enviados

        try {
            await UsuariosUpdateModel.updateUsuario(id, data);
            res.status(200).json({ message: 'Usuário atualizado com sucesso' });
        } catch (error) {
            logger.error('Erro ao atualizar o usuário:', error);
            res.status(500).json({ error: 'Erro ao atualizar o usuário' });
        }
    }
}

module.exports = UsuariosUpdateController;

