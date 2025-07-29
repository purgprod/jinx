// routes/route_rotinas.js
const express = require('express');
const router = express.Router();

// Objeto para armazenar o estado de execução dos endpoints
const executionLocks = {};

// Middleware para verificar se o endpoint está em execução
function lockMiddleware(req, res, next) {
    const endpoint = req.path;
    
    if (executionLocks[endpoint]) {
        return res.status(429).json({ message: 'Endpoint is already in execution. Please try again later.' });
    }

    executionLocks[endpoint] = true;

    // Usando 'close' para garantir que o lock seja liberado
    res.on('close', () => {
        delete executionLocks[endpoint]; // Libera o bloqueio após a execução terminar
    });

    next();
}

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
const ManutencaoSinistroUsuariosController = require('../controllers/rotinas/controller_manutencao_sinistro_usuarios');
const ManutencaoPlanosAssinaturasHistoricoController = require('../controllers/rotinas/controller_manutencao_planos_assinaturas_historicos');

//Variáveis exclusivas de rotinas da Poppy
const PoppyRecompraPinsSinistroController = require('../controllers/rotinas/controller_poppy_recompra_pins_sinistro.js');
const PoppyRecompraPinsVencidosController = require('../controllers/rotinas/controller_poppy_recompra_pins_vencidos.js');
const PoppyPagamentoRendimentoDiarioController = require('../controllers/rotinas/controller_poppy_pagamento_rendimento_diario.js');
const PoppyPagamentoAssinaturaDiarioController = require('../controllers/rotinas/controller_poppy_pagamento_assinatura_diario.js');
const PoppyCompraDiariaPinsController = require('../controllers/rotinas/controller_poppy_compra_diaria_pins.js');
const PoppyPagamentoEmblemasDiarioController = require('../controllers/rotinas/controller_poppy_pagamento_emblemas_diario.js');

//----------------------------------------------
// ROTINAS EXCLUSIVAS DE MANUTENÇÃO DO ECOSSISTEMA
// ---------------------------------------------

// Rota para carregar rotinas
router.get('/api/rotinas', lockMiddleware, ManutencaoRotinasBuscarController.getRotinas);

// Rota para atualizar no banco de dados o horário da última atualização
router.put('/api/rotinas/:id/manutencao-atualizar-ultima-execucao', lockMiddleware, ManutencaoAtualizarUltimaExecucaoController.atualizarUltimaExecucao);

// Rota para alterar o status da rotina para sucesso
router.post('/api/rotinas/:id/manutencao-status-execucao-sucesso', lockMiddleware, ManutencaoStatusExecucaoSucessoController.executarRotina);

// Rota para alterar o status da rotina para falha
router.post('/api/rotinas/:id/manutencao-status-execucao-falha', lockMiddleware, ManutencaoStatusExecucaoFalhaController.executarRotinaFalha);

// Rota para gravar no banco de dados o free float de cada token
router.post('/api/rotinas/tokens-historico-free-float', lockMiddleware, ManutencaoTokensHistoricoFreeFloatController.executeTokensHistoricoFreeFloat);

// Rota para gravar no banco de dados os investimentos e rendimentos históricos de cada usuário 
router.post('/api/rotinas/investimento-rendimento-historico', lockMiddleware, ManutencaoInvestimentoRendimentoHistoricoController.executeInvestimentoRendimentoHistorico);

// Rota para inativar um Pin que esteja no sinistro
router.put('/api/rotinas/checagem-pins-sinistro', lockMiddleware, ManutencaoChecagemPinsSinistroController.executeChecagemPinsSinistro);

// Rota para atualizar o status execução de todas as rotinas para pendente
router.get('/api/rotinas/manutencao-update-status-execucao-pendente', lockMiddleware, ManutencaoUpdateStatusExecucaoPendenteController.atualizarStatusExecucao);

// Rota para inativar um resultado financeiro vencido
router.put('/api/rotinas/manutencao-inativar-resultado-financeiro-vencido', lockMiddleware, ManutencaoChecagemResultadosFinanceirosVencimentoController.executeChecagemResultadosFinanceiros);

// Rota para rankear os nossos usuários baseados no saldo deles
router.put('/api/rotinas/manutencao-ranking-usuarios', lockMiddleware, ManutencaoRankingUsuariosController.executeManutencaoRankingUsuarios);

// Rota para setar o sinistro dos nossos usuários baseados no ranking deles
router.put('/api/rotinas/manutencao-sinistro-usuarios', lockMiddleware, ManutencaoSinistroUsuariosController.executeManutencaoSinistroUsuarios);

// Rota para gravar no banco os planos das assinaturas diário
router.post('/api/rotinas/manutencao-planos-assinaturas-historico', lockMiddleware, ManutencaoPlanosAssinaturasHistoricoController.executeManutencaoPlanosAssinaturasHistoricos);

//----------------------------------------------
// ROTINAS EXCLUSIVAS DA POPPY
// ---------------------------------------------

// Rota para recomprar um Pin que esteja no sinistro
router.put('/api/rotinas/poppy-recompra-pins-sinistro', lockMiddleware, PoppyRecompraPinsSinistroController.executeRecompraPinsSinistro);

// Rota para recomprar um Pin que esteja no vencidos
router.put('/api/rotinas/poppy-recompra-pins-vencidos', lockMiddleware, PoppyRecompraPinsVencidosController.executeRecompraPinsVencidos);

// Rota para pagamento do rendimento diário dos Pins
router.put('/api/rotinas/poppy-pagamento-rendimento-diario', lockMiddleware, PoppyPagamentoRendimentoDiarioController.executePagamentoRendimentoDiario);

// Rota para pagamento da assinatura diário em X% dos rendimentos
router.put('/api/rotinas/poppy-pagamento-assinatura-diario', lockMiddleware, PoppyPagamentoAssinaturaDiarioController.executePagamentoAssinatura);

// Rota para pagamento da assinatura diário em X% dos rendimentos
router.put('/api/rotinas/poppy-compra-diaria-pins', lockMiddleware, PoppyCompraDiariaPinsController.executarCompraDiariaPins);

// Rota para pagamento do emblema diário em X% do saldo
router.put('/api/rotinas/poppy-pagamento-emblema-diario', lockMiddleware, PoppyPagamentoEmblemasDiarioController.executarPagamentoEmblemas);

module.exports = router;

