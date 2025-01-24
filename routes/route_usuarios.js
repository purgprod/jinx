// routes/route_usuarios.js

const express = require('express');
const router = express.Router();
const UsuariosController = require('../controllers/controller_usuarios');

// Rota para criar um novo usuário
router.post('/api/usuarios', UsuariosController.createUser);

// Rota para buscar todos os usuários
router.get('/api/usuarios', UsuariosController.getUsers);

// Rota para obter o próximo usuario_id
router.get('/api/usuarios/next-id', UsuariosController.getNextUserId);

// Rota para atualizar um usuário
router.put('/api/usuarios/:id', UsuariosController.updateUsuario);

// Rota para inativar um usuário
router.put('/api/usuarios/:id/inativar', UsuariosController.inativarUsuario);

// Rota para ativar um usuário
router.put('/api/usuarios/:id/ativar', UsuariosController.ativarUsuario);

// Rota para obter tokens de um usuário
router.get('/api/usuarios/:id/tokens', UsuariosController.getUserTokens);

// Rota para redefinir a senha de um usuário
router.post('/api/usuarios/:id/resetar-senha', UsuariosController.resetarSenha);

module.exports = router;

