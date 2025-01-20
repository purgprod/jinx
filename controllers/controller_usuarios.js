// controllers/controller_usuarios.js

const UsuariosModel = require('../models/model_usuarios');
const logger = require('../logger');

class UsuariosController {
    // Endpoint para criar um novo usuário
    static async createUser(req, res) {
        const { nome, email, password } = req.body;
        logger.info('Tentativa de criação de usuário', { nome, email });

        try {
            const usuarioId = await UsuariosModel.getNextUserId();
            await UsuariosModel.createUser({ usuario_id: usuarioId, nome, email, password });
            logger.info('Usuário criado com sucesso', { usuario_id: usuarioId });
            res.status(201).json({ message: 'Usuário criado com sucesso!' });
        } catch (error) {
            logger.error('Erro ao criar usuário', error);
            res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    }

    // Endpoint para buscar todos os usuários
    static async getUsers(req, res) {
        logger.info('Tentativa de busca de todos os usuários');

        try {
            const users = await UsuariosModel.getUsers();
            logger.info(`Número de usuários encontrados: ${users.length}`);
            res.json(users);
        } catch (error) {
            logger.error('Erro ao buscar usuários', error);
            res.status(500).json({ error: 'Erro ao buscar os usuários' });
        }
    }

    // Endpoint para obter o próximo usuario_id
    static async getNextUserId(req, res) {
        logger.info('Tentativa de obtenção do próximo usuario_id');

        try {
            const nextId = await UsuariosModel.getNextUserId(); // Corrige o nome do modelo
            logger.info('Próximo usuario_id obtido com sucesso', { nextId });
            res.json({ nextId });
        } catch (error) {
            logger.error('Erro ao obter próximo usuario_id', error);
            res.status(500).json({ error: 'Erro ao obter próximo usuario_id' });
        }
    }
}

module.exports = UsuariosController;

