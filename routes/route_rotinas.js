// routes/route_rotinas.js
const express = require('express');
const router = express.Router();
const TokensHistoricoFreeFloatController = require('../controllers/rotinas/controller_tokens_historico_free_float');

// Rota para guardar no banco de dados o free float de cada token
router.post('/api/rotinas/tokens_historico_free_float', TokensHistoricoFreeFloatController.executeTokensHistoricoFreeFloat);

module.exports = router;

