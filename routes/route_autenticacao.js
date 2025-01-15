const express = require('express');
const router = express.Router();
const controller_autenticacao = require('../controllers/controller_autenticacao');

// Rota para login
router.post('/login', controller_autenticacao.login);

// Rota para registro
router.post('/register', controller_autenticacao.register);

// Rota para logout
router.post('/logout', controller_autenticacao.logout);

module.exports = router;
