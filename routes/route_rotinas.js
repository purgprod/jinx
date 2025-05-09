// routes/route_rotinas.js
const express = require('express');
const router = express.Router();

//Variáveis exclusivas de rotinas de manutenção do ecossistema
const ManutencaoRotinasBuscarController = require('../controllers/rotinas/controller_manutencao_buscar_rotinas');
const ManutencaoAtualizarUltimaExecucaoController = require('../controllers/rotinas/controller_manutencao_atualizar_ultima_execucao');
const ManutencaoStatusExecucaoSucessoController = require('../controllers/rotinas/controller_manutencao_status_execucao_sucesso');
const ManutencaoStatusExecucaoFalhaController = require('../controllers/rotinas/controller_manutencao_status_execucao_falha');
const ManutencaoTokensHistoricoFreeFloatController = require('../controllers/rotinas/controller_manutencao_tokens_historico_free_float');
const ManutencaoInvestimentoRendimentoHistoricoController = require('../controllers/rotinas/controller_manutencao_investimento_e_rendimento_historico_por_usuario.js');
const ManutencaoChecagemPinsSinistroController = require('../controllers/rotinas/controller_manutencao_checagem_pins_sinistro.js');
const ManutencaoUpdateStatusExecucaoPendenteController = require('../controllers/rotinas/controller_manutencao_update_status_execucao_pendente');
const ManutencaoChecagemResultadosFinanceirosVencimentoController = require('../controllers/rotinas/controller_manutencao_checagem_resultados_financeiros_vencimento');
const ManutencaoRankingUsuariosController = require('../controllers/rotinas/controller_manutencao_ranking_usuarios');

//Variáveis exclusivas de rotinas da Poppy
const PoppyRecompraPinsSinistroController = require('../controllers/rotinas/controller_poppy_recompra_pins_sinistro.js');
const PoppyRecompraPinsVencidosController = require('../controllers/rotinas/controller_poppy_recompra_pins_vencidos.js');
const PoppyPagamentoRendimentoDiarioController = require('../controllers/rotinas/controller_poppy_pagamento_rendimento_diario.js');
const PoppyPagamentoAssinaturaDiarioController = require('../controllers/rotinas/controller_poppy_pagamento_assinatura_diario.js');


//----------------------------------------------
// ROTINAS EXCLUSIVAS DE MANUTENÇÃO DO ECOSSISTEMA
// ---------------------------------------------

// Rota para carregar rotinas
router.get('/api/rotinas', ManutencaoRotinasBuscarController.getRotinas);

// Rota para atualizar no banco de dados o horário da última atualização
router.put('/api/rotinas/:id/manutencao-atualizar-ultima-execucao', ManutencaoAtualizarUltimaExecucaoController.atualizarUltimaExecucao);

// Rota para alterar o status da rotina para sucesso
router.post('/api/rotinas/:id/manutencao-status-execucao-sucesso', ManutencaoStatusExecucaoSucessoController.executarRotina);

// Rota para alterar o status da rotina para falha
router.post('/api/rotinas/:id/manutencao-status-execucao-falha', ManutencaoStatusExecucaoFalhaController.executarRotina);

// Rota para gravar no banco de dados o free float de cada token
router.post('/api/rotinas/tokens-historico-free-float', ManutencaoTokensHistoricoFreeFloatController.executeTokensHistoricoFreeFloat);

// Rota para gravar no banco de dados os investimentos e rendimentos históricos de cada usuário 
router.post('/api/rotinas/investimento-rendimento-historico', ManutencaoInvestimentoRendimentoHistoricoController.executeInvestimentoRendimentoHistorico);

// Rota para inativar um Pin que esteja no sinistro
router.put('/api/rotinas/checagem-pins-sinistro', ManutencaoChecagemPinsSinistroController.executeChecagemPinsSinistro);

// Rota para atualizar o status execução de todas as rotinas para pendente
router.get('/api/rotinas/manutencao-update-status-execucao-pendente', ManutencaoUpdateStatusExecucaoPendenteController.atualizarStatusExecucao);

// Rota para inativar um resultado financeiro vencido
router.put('/api/rotinas/manutencao-inativar-resultado-financeiro-vencido', ManutencaoChecagemResultadosFinanceirosVencimentoController.executeChecagemResultadosFinanceiros);

// Rota para rankear os nossos usuários baseados no saldo deles
router.put('/api/rotinas/manutencao-ranking-usuarios', ManutencaoRankingUsuariosController.executeManutencaoRankingUsuarios);

//----------------------------------------------
// ROTINAS EXCLUSIVAS DA POPPY
// ---------------------------------------------

// Rota para recomprar um Pin que esteja no sinistro
router.put('/api/rotinas/poppy-recompra-pins-sinistro', PoppyRecompraPinsSinistroController.executeRecompraPinsSinistro);

// Rota para recomprar um Pin que esteja no vencidos
router.put('/api/rotinas/poppy-recompra-pins-vencidos', PoppyRecompraPinsVencidosController.executeRecompraPinsVencidos);

// Rota para pagamento do rendimento diário dos Pins
router.put('/api/rotinas/poppy-pagamento-rendimento-diario', PoppyPagamentoRendimentoDiarioController.executePagamentoRendimentoDiario);

// Rota para pagamento da assinatura diário em X% dos rendimentos
router.put('/api/rotinas/poppy-pagamento-assinatura-diario', PoppyPagamentoAssinaturaDiarioController.executePagamentoAssinatura);

module.exports = router;

