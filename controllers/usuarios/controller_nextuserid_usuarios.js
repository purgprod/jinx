// controllers/usuarios/controller_nextuserid_usuarios.js

const UsuariosNextUserIdModel = require('../../models/usuarios/model_nextuserid_usuarios');
const logger = require('../../logger');

class UsuariosNextUserIdController {

    // Endpoint para obter o próximo usuario_id
    static async getNextUserId(req, res) {
        logger.info('Tentativa de obtenção do próximo usuario_id');

        try {
            const nextId = await UsuariosNextUserIdModel.getNextUserId();
            logger.info('Próximo usuario_id obtido com sucesso', { nextId });
            res.json({ nextId });
        } catch (error) {
            logger.error('Erro ao obter próximo usuario_id', error);
            res.status(500).json({ error: 'Erro ao obter próximo usuario_id' });
        }
    }
}

module.exports = UsuariosNextUserIdController;

