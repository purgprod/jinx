// routes/route_rotinas.js
const express = require('express');
const router = express.Router();

//Variáveis exclusivas de rotinas de manutenção do ecossistema
const ManutencaoRotinasBuscarController = require('../controllers/rotinas/controller_buscar_rotinas');
const ManutencaoRotinasAtualizarController = require('../controllers/rotinas/controller_atualizar_ultima_execucao');
const ManutencaoRotinasExecutarController = require('../controllers/rotinas/controller_executar_rotina');
const ManutencaoTokensHistoricoFreeFloatController = require('../controllers/rotinas/controller_tokens_historico_free_float');
const ManutencaoInvestimentoRendimentoHistoricoController = require('../controllers/rotinas/controller_investimento_e_rendimento_historico_por_usuario.js');
const ManutencaoChecagemPinsSinistroController = require('../controllers/rotinas/controller_checagem_pins_sinistro.js');
const ManutencaoUpdateStatusExecucaoPendenteController = require('../controllers/rotinas/controller_manutencao_update_status_execucao_pendente');

//Variáveis exclusivas de rotinas da Poppy
const PoppyRecompraPinsSinistroController = require('../controllers/rotinas/controller_poppy_recompra_pins_sinistro.js');


//----------------------------------------------
// ROTINAS EXCLUSIVAS DE MANUTENÇÃO DO ECOSSISTEMA
// ---------------------------------------------

// Rota para carregar rotinas
router.get('/api/rotinas', ManutencaoRotinasBuscarController.getRotinas);

// Rota para atualizar no banco de dados o horário da última atualização
router.put('/api/rotinas/:id/atualizar-execucao', ManutencaoRotinasAtualizarController.atualizarUltimaExecucao);

// Rota para alterar o status da rotina
router.post('/api/rotinas/:id/executar', ManutencaoRotinasExecutarController.executarRotina);

// Rota para gravar no banco de dados o free float de cada token
router.post('/api/rotinas/tokens-historico-free-float', ManutencaoTokensHistoricoFreeFloatController.executeTokensHistoricoFreeFloat);

// Rota para gravar no banco de dados os investimentos e rendimentos históricos de cada usuário 
router.post('/api/rotinas/investimento-rendimento-historico', ManutencaoInvestimentoRendimentoHistoricoController.executeInvestimentoRendimentoHistorico);

// Rota para inativar um Pin que esteja no sinistro
router.put('/api/rotinas/checagem-pins-sinistro', ManutencaoChecagemPinsSinistroController.executeChecagemPinsSinistro);

// Rota para atualizar o status execução de todas as rotinas para pendente
router.get('/api/rotinas/manutencao-update-status-execucao-pendente', ManutencaoUpdateStatusExecucaoPendenteController.atualizarStatusExecucao);

//----------------------------------------------
// ROTINAS EXCLUSIVAS DA POPPY
// ---------------------------------------------

// Rota para recomprar um Pin que esteja no sinistro
router.put('/api/rotinas/poppy-recompra-pins-sinistro', PoppyRecompraPinsSinistroController.executeRecompraPinsSinistro);

module.exports = router;

