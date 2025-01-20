// routes/route_usuarios.js

const express = require('express');
const router = express.Router();
const UsuariosController = require('../controllers/controller_usuarios');

// Rota para criar um novo usuário
router.post('/api/usuarios', UsuariosController.createUser);

//Rota para buscar usuários
router.get('/api/usuarios', UsuariosController.getUsers);

//Rota para obter o próximo usuario_id
router.get('/api/usuarios/next-id', UsuariosController.getNextUserId);

module.exports = router;

