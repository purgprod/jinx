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
            const nextId = await UsuariosModel.getNextUserId();
            logger.info('Próximo usuario_id obtido com sucesso', { nextId });
            res.json({ nextId });
        } catch (error) {
            logger.error('Erro ao obter próximo usuario_id', error);
            res.status(500).json({ error: 'Erro ao obter próximo usuario_id' });
        }
    }

    // Endpoint para fazer update em um usuário
    static async updateUsuario(req, res) {
        const id = req.params.id;
        const data = req.body;

        try {
            await UsuariosModel.updateUsuario(id, data);
            res.status(200).json({ message: 'Usuário atualizado com sucesso' });
        } catch (error) {
            logger.error('Erro ao atualizar o usuário:', error);
            res.status(500).json({ error: 'Erro ao atualizar o usuário' });
        }
    }

    // Endpoint para inativar um usuário
    static async inativarUsuario(req, res) {
        const id = req.params.id;
        
        try {
            await UsuariosModel.inativarUsuario(id);
            res.status(200).json({ message: 'Usuário inativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao inativar o usuário:', error);
            res.status(500).json({ error: 'Erro ao inativar o usuário' });
        }
    }

    // Endpoint para ativar um usuário
    static async ativarUsuario(req, res) {
        const id = req.params.id;
        
        try {
            await UsuariosModel.ativarUsuario(id);
            res.status(200).json({ message: 'Usuário ativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao ativar o usuário:', error);
            res.status(500).json({ error: 'Erro ao ativar o usuário' });
        }
    }

    // Endpoint para buscar tokens de um usuário
    static async getUserTokens(req, res) {
        const usuarioId = req.params.id;
        logger.info(`Tentativa de busca de tokens para usuário com ID: ${usuarioId}`);

        try {
            const tokens = await UsuariosModel.tokensUsuario(usuarioId);
            if (tokens.length > 0) {
                logger.info(`Tokens encontrados para o usuário com ID: ${usuarioId}`);
            } else {
                logger.info(`Nenhum token encontrado para o usuário com ID: ${usuarioId}`);
            }
            res.json(tokens);
        } catch (error) {
            logger.error(`Erro ao buscar tokens para o usuário com ID: ${usuarioId}`, error);
            res.status(500).json({ error: 'Erro ao buscar tokens do usuário' });
        }
    }
}

module.exports = UsuariosController;

