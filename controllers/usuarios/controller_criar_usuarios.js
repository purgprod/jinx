// controllers/usuarios/controller_criar_usuarios.js

const UsuariosCriarModel = require('../../models/usuarios/model_criar_usuarios');
const UsuariosNextUserIdModel = require('../../models/usuarios/model_nextuserid_usuarios');
const logger = require('../../logger');

class UsuariosCriarController {

// Endpoint para criar um novo usuário

static async createUser(req, res) {
        const { nome_completo: apelido, email, password } = req.body;
        logger.info('Tentativa de criação de usuário', { apelido, email });

        try {
            const usuarioId = await UsuariosNextUserIdModel.getNextUserId();
            await UsuariosCriarModel.createUser({ usuario_id: usuarioId, apelido, email, password });
            logger.info('Usuário criado com sucesso', { usuario_id: usuarioId });
	    res.status(201).json({ message: 'Usuário criado com sucesso!' });
        } catch (error) {
            logger.error('Erro ao criar usuário', error);
            res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    }
}

module.exports = UsuariosCriarController;

