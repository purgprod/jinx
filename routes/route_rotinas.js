// routes/route_rotinas.js
const express = require('express');
const router = express.Router();
const RotinasBuscarController = require('../controllers/rotinas/controller_buscar_rotinas');
const RotinasAtualizarController = require('../controllers/rotinas/controller_atualizar_ultima_execucao');
const RotinasExecutarController = require('../controllers/rotinas/controller_executar_rotina');
const TokensHistoricoFreeFloatController = require('../controllers/rotinas/controller_tokens_historico_free_float');
const InvestimentoRendimentoHistoricoController = require('../controllers/rotinas/controller_investimento_e_rendimento_historico_por_usuario.js');
const ChecagemPinsSinistroController = require('../controllers/rotinas/controller_checagem_pins_sinistro.js');
const RecompraPinsSinistroController = require('../controllers/rotinas/controller_recompra_pins_sinistro.js');


// Rota para carregar rotinas
router.get('/api/rotinas', RotinasBuscarController.getRotinas);

// Rota para atualizar no banco de dados o horário da última atualização
router.put('/api/rotinas/:id/atualizar-execucao', RotinasAtualizarController.atualizarUltimaExecucao);

// Rota para alterar o status da rotina
router.post('/api/rotinas/:id/executar', RotinasExecutarController.executarRotina);

// Rota para gravar no banco de dados o free float de cada token
router.post('/api/rotinas/tokens-historico-free-float', TokensHistoricoFreeFloatController.executeTokensHistoricoFreeFloat);

// Rota para gravar no banco de dados os investimentos e rendimentos históricos de cada usuário 
router.post('/api/rotinas/investimento-rendimento-historico', InvestimentoRendimentoHistoricoController.executeInvestimentoRendimentoHistorico);

// Rota para inativar um Pin que esteja no sinistro
router.put('/api/rotinas/checagem-pins-sinistro', ChecagemPinsSinistroController.executeChecagemPinsSinistro);

// Rota para recomprar um Pin que esteja no sinistro
router.put('/api/rotinas/recompra-pins-sinistro', RecompraPinsSinistroController.executeRecompraPinsSinistro);

module.exports = router;

