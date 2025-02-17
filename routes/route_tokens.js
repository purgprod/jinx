// routes/route_tokens.js
const express = require('express');
const router = express.Router();
const TokensBuscarController = require('../controllers/tokens/controller_buscar_tokens');
const TokensUpdateController = require('../controllers/tokens/controller_update_tokens');
const TokensInativarController = require('../controllers/tokens/controller_inativar_tokens');
const TokensAtivarController = require('../controllers/tokens/controller_ativar_tokens');
const TokensFreeFloatController = require('../controllers/tokens/controller_freefloat_tokens');

// Rota para carregar tokens
router.get('/api/tokens', TokensBuscarController.getTokens);

// Rota para calcular o free float de tokens
router.get('/api/tokens/free-float/:id', TokensFreeFloatController.getFreeFloatTokens);

// Rota para atualizar um token
router.put('/api/tokens/:id', TokensUpdateController.updateToken);

// Rota para inativar um token
router.put('/api/tokens/:id/inativar', TokensInativarController.inativarToken);

// Rota para ativar um token
router.put('/api/tokens/:id/ativar', TokensAtivarController.ativarToken);

module.exports = router;

