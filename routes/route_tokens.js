// routes/route_tokens.js
const express = require('express');
const router = express.Router();
const TokensController = require('../controllers/controller_tokens');

// Rota para carregar tokens
router.get('/api/tokens', TokensController.getTokens);

// Rota para atualizar um token
router.put('/api/tokens/:id', TokensController.updateTokens);

module.exports = router;

