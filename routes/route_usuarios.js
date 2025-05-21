// routes/route_usuarios.js

const express = require('express');
const router = express.Router();
const UsuariosBuscarController = require('../controllers/usuarios/controller_buscar_usuarios');
const UsuariosCriarController = require('../controllers/usuarios/controller_criar_usuarios');
const UsuariosNextUserIdController = require('../controllers/usuarios/controller_nextuserid_usuarios');
const UsuariosUpdateController = require('../controllers/usuarios/controller_update_usuarios');
const UsuariosInativarController = require('../controllers/usuarios/controller_inativar_usuarios');
const UsuariosAtivarController = require('../controllers/usuarios/controller_ativar_usuarios');
const UsuariosTokensController = require('../controllers/usuarios/controller_tokens_usuarios');
const UsuariosResetarSenhaController = require('../controllers/usuarios/controller_resetarsenha_usuarios');
const UsuariosDadosFinanceirosController = require('../controllers/usuarios/controller_dadosfinanceiros_usuarios');
const UsuariosDadosFinanceirosHistoricosController = require('../controllers/usuarios/controller_dadosfinanceiroshistoricos_usuarios');
const UsuariosDadosRendimentosHistoricosController = require('../controllers/usuarios/controller_dadosrendimentoshistoricos_usuarios');
const UsuariosSaldosController = require('../controllers/usuarios/controller_saldos_usuarios');
const UsuariosSaquesController = require('../controllers/usuarios/controller_saques_usuarios');
const UsuariosDepositosController = require('../controllers/usuarios/controller_depositos_usuarios');
const UsuariosSuitabilityController = require('../controllers/usuarios/controller_suitability_usuarios');
const UsuariosSuitabilityUpdateController = require('../controllers/usuarios/controller_calculo_suitability_update');
const UsuariosSuitabilityComplementarUpdateController = require('../controllers/usuarios/controller_calculo_suitability_complementar_update');
const UsuariosPerfilSuitabilityCompletoController = require('../controllers/usuarios/controller_perfil_suitability_completo_usuario');
const UsuariosRankingController = require('../controllers/usuarios/controller_ranking_usuario');
const UsuariosSinistroController = require('../controllers/usuarios/controller_sinistro_usuario');
const UsuariosSuitabilityComplementarController = require('../controllers/usuarios/controller_suitability_complementar_usuarios');

// Rota para criar um novo usuário
router.post('/api/usuarios', UsuariosCriarController.createUser);

// Rota para buscar todos os usuários
router.get('/api/usuarios', UsuariosBuscarController.getUsers);

// Rota para obter o próximo usuario_id
router.get('/api/usuarios/next-id', UsuariosNextUserIdController.getNextUserId);

// Rota para atualizar um usuário
router.put('/api/usuarios/:id', UsuariosUpdateController.updateUsuario);

// Rota para inativar um usuário
router.put('/api/usuarios/:id/inativar', UsuariosInativarController.inativarUsuario);

// Rota para ativar um usuário
router.put('/api/usuarios/:id/ativar', UsuariosAtivarController.ativarUsuario);

// Rota para obter tokens de um usuário
router.get('/api/usuarios/:id/tokens', UsuariosTokensController.getUserTokens);

// Rota para redefinir a senha de um usuário
router.post('/api/usuarios/:id/resetar-senha', UsuariosResetarSenhaController.resetarSenha);

// Rota para obter os últimos dados financeiros do usuário
router.get('/api/usuarios/:id/ultimos-dados-financeiros', UsuariosDadosFinanceirosController.getUltimosDadosFinanceiros);

// Rota para obter os dados de valor de carteira históricos do usuário
router.get('/api/usuarios/:id/dados-financeiros-historicos', UsuariosDadosFinanceirosHistoricosController.getDadosFinanceirosHistoricos);

// Rota para obter os dados de rendimentos históricos do usuário
router.get('/api/usuarios/:id/dados-financeiros-rendimentos-historicos', UsuariosDadosRendimentosHistoricosController.getDadosRendimentosHistoricos);

// Rota para obter o saldo do usuário 
router.get('/api/usuarios/:id/dados-saldo', UsuariosSaldosController.getSaldos);

// Rota para obter o total de saques do usuário 
router.get('/api/usuarios/:id/dados-saques', UsuariosSaquesController.getSaques);

// Rota para obter o total de depositos do usuário 
router.get('/api/usuarios/:id/dados-depositos', UsuariosDepositosController.getDepositos);

// Rota para obter o suitability do usuário
router.get('/api/usuarios/:id/suitability', UsuariosSuitabilityController.getSuitability);

// Rota para fazer o calculo e update do suitability do usuário
router.put('/api/usuarios/:id/calculo-suitability-update', UsuariosSuitabilityUpdateController.calcularSuitability);

// Rota para fazer o calculo e update do suitability complementar do usuário
router.put('/api/usuarios/:id/calculo-suitability-complementar-update', UsuariosSuitabilityComplementarUpdateController.calcularSuitabilityComplementar);

// Rota para obter qual o suitability e suitability_complementar de cada usuário
router.get('/api/usuarios/:id/perfil-suitability-usuario-completo', UsuariosPerfilSuitabilityCompletoController.getSuitability);

// Rota para obter qual o ranking de cada usuário
router.get('/api/usuarios/:id/ranking-usuarios', UsuariosRankingController.getRanking);

// Rota para obter qual o sinistro de cada usuário
router.get('/api/usuarios/:id/sinistro-usuarios', UsuariosSinistroController.getSinistro);

// Rota para obter o suitability complementar do usuário
router.get('/api/usuarios/:id/suitability-complementar', UsuariosSuitabilityComplementarController.getSuitabilityComplementar);

module.exports = router;

