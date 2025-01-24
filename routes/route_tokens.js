// routes/route_tokens.js
const express = require('express');
const router = express.Router();
const TokensController = require('../controllers/controller_tokens');

// Rota para carregar tokens
router.get('/api/tokens', TokensController.getTokens);

// Rota para atualizar um token
router.put('/api/tokens/:id', TokensController.updateToken);

// Rota para inativar um token
router.put('/api/tokens/:id/inativar', TokensController.inativarToken);

// Rota para ativar um token
router.put('/api/tokens/:id/ativar', TokensController.ativarToken);

module.exports = router;

