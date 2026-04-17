// routes/route_rotinas.js
const express = require('express');
const router = express.Router();

// Objeto para armazenar o estado de execução dos endpoints
const executionLocks = {};

// Middleware de autenticação para rotinas:
// Permite chamadas internas (cron via localhost) ou usuário autenticado (painel)
function rotinasAuth(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress;
    const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    if (isLocalhost || req.session?.user) {
        return next();
    }
    return res.status(403).json({ error: 'Acesso negado' });
}

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
const ManutencaoLigaUsuariosController = require('../controllers/rotinas/controller_manutencao_liga_usuarios');
const ManutencaoSinistroUsuariosController = require('../controllers/rotinas/controller_manutencao_sinistro_usuarios');
const ManutencaoPlanosAssinaturasHistoricoController = require('../controllers/rotinas/controller_manutencao_planos_assinaturas_historicos');

//Variáveis exclusivas de rotinas da Poppy
const PoppyRecompraPinsSinistroController = require('../controllers/rotinas/controller_poppy_recompra_pins_sinistro.js');
const PoppyRecompraPinsVencidosController = require('../controllers/rotinas/controller_poppy_recompra_pins_vencidos.js');
const PoppyPagamentoRendimentoDiarioController = require('../controllers/rotinas/controller_poppy_pagamento_rendimento_diario.js');
const PoppyPagamentoAssinaturaDiarioController = require('../controllers/rotinas/controller_poppy_pagamento_assinatura_diario.js');
const PoppyCompraDiariaPinsController = require('../controllers/rotinas/controller_poppy_compra_diaria_pins.js');
const PoppyPagamentoEmblemasDiarioController = require('../controllers/rotinas/controller_poppy_pagamento_emblemas_diario.js');
const VenderTodosPinsController = require('../controllers/rotinas/controller_vender_todos_pins.js');
const CobrancaMetasCartaoController = require('../controllers/rotinas/controller_poppy_cobranca_metas_cartao.js');

//----------------------------------------------
// ROTINAS EXCLUSIVAS DE MANUTENÇÃO DO ECOSSISTEMA
// ---------------------------------------------

// Rota para carregar rotinas
router.get('/api/rotinas', rotinasAuth, lockMiddleware, ManutencaoRotinasBuscarController.getRotinas);

// Rota para atualizar no banco de dados o horário da última atualização
router.put('/api/rotinas/:id/manutencao-atualizar-ultima-execucao', rotinasAuth, lockMiddleware, ManutencaoAtualizarUltimaExecucaoController.atualizarUltimaExecucao);

// Rota para alterar o status da rotina para sucesso
router.post('/api/rotinas/:id/manutencao-status-execucao-sucesso', rotinasAuth, lockMiddleware, ManutencaoStatusExecucaoSucessoController.executarRotina);

// Rota para alterar o status da rotina para falha
router.post('/api/rotinas/:id/manutencao-status-execucao-falha', rotinasAuth, lockMiddleware, ManutencaoStatusExecucaoFalhaController.executarRotinaFalha);

// Rota para gravar no banco de dados o free float de cada token
router.post('/api/rotinas/tokens-historico-free-float', rotinasAuth, lockMiddleware, ManutencaoTokensHistoricoFreeFloatController.executeTokensHistoricoFreeFloat);

// Rota para gravar no banco de dados os investimentos e rendimentos históricos de cada usuário
router.post('/api/rotinas/investimento-rendimento-historico', rotinasAuth, lockMiddleware, ManutencaoInvestimentoRendimentoHistoricoController.executeInvestimentoRendimentoHistorico);

// Rota para inativar um Pin que esteja no sinistro
router.put('/api/rotinas/checagem-pins-sinistro', rotinasAuth, lockMiddleware, ManutencaoChecagemPinsSinistroController.executeChecagemPinsSinistro);

// Rota para atualizar o status execução de todas as rotinas para pendente
router.get('/api/rotinas/manutencao-update-status-execucao-pendente', rotinasAuth, lockMiddleware, ManutencaoUpdateStatusExecucaoPendenteController.atualizarStatusExecucao);

// Rota para inativar um resultado financeiro vencido
router.put('/api/rotinas/manutencao-inativar-resultado-financeiro-vencido', rotinasAuth, lockMiddleware, ManutencaoChecagemResultadosFinanceirosVencimentoController.executeChecagemResultadosFinanceiros);

// Rota para atualizar a liga dos usuários com base nos pontos deles
router.put('/api/rotinas/manutencao-liga-usuarios', rotinasAuth, lockMiddleware, ManutencaoLigaUsuariosController.executeManutencaoLigaUsuarios);

// Rota para setar o sinistro dos nossos usuários baseados na liga deles
router.put('/api/rotinas/manutencao-sinistro-usuarios', rotinasAuth, lockMiddleware, ManutencaoSinistroUsuariosController.executeManutencaoSinistroUsuarios);

// Rota para gravar no banco os planos das assinaturas diário
router.post('/api/rotinas/manutencao-planos-assinaturas-historico', rotinasAuth, lockMiddleware, ManutencaoPlanosAssinaturasHistoricoController.executeManutencaoPlanosAssinaturasHistoricos);

//----------------------------------------------
// ROTINAS EXCLUSIVAS DA POPPY
// ---------------------------------------------

// Rota para recomprar um Pin que esteja no sinistro
router.put('/api/rotinas/poppy-recompra-pins-sinistro', rotinasAuth, lockMiddleware, PoppyRecompraPinsSinistroController.executeRecompraPinsSinistro);

// Rota para recomprar um Pin que esteja no vencidos
router.put('/api/rotinas/poppy-recompra-pins-vencidos', rotinasAuth, lockMiddleware, PoppyRecompraPinsVencidosController.executeRecompraPinsVencidos);

// Rota para pagamento do rendimento diário dos Pins
router.put('/api/rotinas/poppy-pagamento-rendimento-diario', rotinasAuth, lockMiddleware, PoppyPagamentoRendimentoDiarioController.executePagamentoRendimentoDiario);

// Rota para pagamento da assinatura diário em X% dos rendimentos
router.put('/api/rotinas/poppy-pagamento-assinatura-diario', rotinasAuth, lockMiddleware, PoppyPagamentoAssinaturaDiarioController.executePagamentoAssinatura);

// Rota para pagamento da compra diária de pins
router.put('/api/rotinas/poppy-compra-diaria-pins', rotinasAuth, lockMiddleware, PoppyCompraDiariaPinsController.executarCompraDiariaPins);

// Rota para pagamento do emblema diário em X% do saldo
router.put('/api/rotinas/poppy-pagamento-emblema-diario', rotinasAuth, lockMiddleware, PoppyPagamentoEmblemasDiarioController.executarPagamentoEmblemas);

// Rota de sanitização: vende todos os Pins de todos os clientes e devolve o valor em saldo
router.put('/api/rotinas/vender-todos-pins', rotinasAuth, lockMiddleware, VenderTodosPinsController.executarVendaTodosPins);

// Rotina mensal: cobrança das metas no cartão de crédito (dia 1 de cada mês)
router.put('/api/rotinas/poppy-cobranca-metas-cartao', rotinasAuth, lockMiddleware, CobrancaMetasCartaoController.executarCobrancas);

module.exports = router;

