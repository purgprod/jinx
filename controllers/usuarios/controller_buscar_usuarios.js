// controllers/usuarios/controller_buscar_usuarios.js

const UsuariosBuscarModel = require('../../models/usuarios/model_buscar_usuarios');
const logger = require('../../logger');

class UsuariosBuscarController {
        
    // Endpoint para buscar todos os usuários
    static async getUsers(req, res) {
        logger.info('Tentativa de busca de todos os usuários');

        try {
            const users = await UsuariosBuscarModel.getUsers();
            logger.info(`Número de usuários encontrados: ${users.length}`);
            res.json(users);
        } catch (error) {
            logger.error('Erro ao buscar usuários', error);
            res.status(500).json({ error: 'Erro ao buscar os usuários' });
        }
    }
}

module.exports = UsuariosBuscarController;

