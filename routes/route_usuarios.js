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
const UsuariosSaquesController = require('../controllers/usuarios/controller_saques_usuarios');
const UsuariosSuitabilityController = require('../controllers/usuarios/controller_suitability_usuarios');

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

// Rota para obter o total de saques do usuário 
router.get('/api/usuarios/:id/dados-saques', UsuariosSaquesController.getSaques);

// Rota para obter o suitability do usuário
router.get('/api/usuarios/:id/suitability', UsuariosSuitabilityController.getSuitability);

module.exports = router;

