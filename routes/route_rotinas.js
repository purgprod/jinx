// routes/route_rotinas.js
const express = require('express');
const router = express.Router();
const RotinasBuscarController = require('../controllers/rotinas/controller_buscar_rotinas');
const TokensHistoricoFreeFloatController = require('../controllers/rotinas/controller_tokens_historico_free_float');
const RotinasAtualizarController = require('../controllers/rotinas/controller_atualizar_ultima_execucao');
const RotinasExecutarController = require('../controllers/rotinas/controller_executar_rotina');

// Rota para carregar rotinas
router.get('/api/rotinas', RotinasBuscarController.getRotinas);

// Rota para guardar no banco de dados o free float de cada token
router.post('/api/rotinas/tokens_historico_free_float', TokensHistoricoFreeFloatController.executeTokensHistoricoFreeFloat);

// Rota para atualizar no banco de dados o horário da última atualização
router.put('/api/rotinas/:id/atualizar-execucao', RotinasAtualizarController.atualizarUltimaExecucao);

// Rota para alterar o status da rotina
router.post('/api/rotinas/:id/executar', RotinasExecutarController.executarRotina);

module.exports = router;

