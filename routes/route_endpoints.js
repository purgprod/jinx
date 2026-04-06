const express = require('express');
const router  = express.Router();

// IMPORTAÇÃO DOS VALIDADORES  <<<<<<<<<<
const { param, body } = require('express-validator');

//const SaldoController     = require('../controllers/endpoints/controller_saldo');
//const InvestidoController = require('../controllers/endpoints/controller_investido');
//const EmblemasController  = require('../controllers/endpoints/controller_emblemas');
const AuthController = require('../controllers/endpoints/controller_autenticacao_purg');
const authMiddleware = require('../middleware/auth'); // Importa o middleware de autenticação
const SaqueController     = require('../controllers/endpoints/controller_saque');
const CancelarSaqueController = require('../controllers/endpoints/controller_cancelar_saque');
const DepositoController     = require('../controllers/endpoints/controller_deposito');
const CancelarDepositoController = require('../controllers/endpoints/controller_cancelar_deposito');
const CarteiraController     = require('../controllers/endpoints/controller_carteira');
const DadosCadastroController     = require('../controllers/endpoints/controller_dados_cadastro');
const DadosEmpresaController     = require('../controllers/endpoints/controller_dados_empresa');
const PinsUsuarioController     = require('../controllers/endpoints/controller_pins_usuario');
const RendimentosUsuarioController     = require('../controllers/endpoints/controller_rendimentos_usuario');
const SaqueHistoricoUsuarioController = require('../controllers/endpoints/controller_saque_historico_do_usuario');
const DepositoHistoricoUsuarioController = require('../controllers/endpoints/controller_deposito_historico_do_usuario');
const BuscarSaquesPendentesUsuarioController = require('../controllers/endpoints/controller_buscar_saques_pendentes_usuario');
const BuscarDepositosPendentesUsuarioController = require('../controllers/endpoints/controller_buscar_depositos_pendentes_usuario');
const UpdateAssinaturaClienteController = require('../controllers/endpoints/controller_update_assinatura_cliente');

//------------ AUTENTICAÇÃO --------------//

// Rota para login - Não requer autenticação
router.post('/endpoints/login', AuthController.login);

// Rota para registro - Não requer autenticação
router.post('/endpoints/register', AuthController.register);

// Demais rotas requerem autenticação
router.use('/endpoints/*', authMiddleware.checkAuthenticated);

// Rota para logout
router.post('/endpoints/logout', authMiddleware.checkAuthenticated, AuthController.logout);

// Rota para check session
router.post('/endpoints/check-session', authMiddleware.checkAuthenticated, AuthController.checkSession);

//------------CONSULTAS------------

// Rota para o saldo do usuário
//router.get('/endpoints/saldo/:id', authMiddleware.checkAuthenticated, SaldoController.getSaldo);

// Rota para o valor investido do usuário
//router.get('/endpoints/investido/:id', authMiddleware.checkAuthenticated, InvestidoController.getInvestido);

// Rota para os emblemas do usuário
//router.get('/endpoints/emblemas/:id', authMiddleware.checkAuthenticated, EmblemasController.getEmblemas);

// Rota para a carteira do usuário
router.get('/endpoints/carteira/:id', authMiddleware.checkAuthenticated, CarteiraController.getCarteira);

// Rota para os dados cadastrais do usuário
router.get('/endpoints/dados-cadastro/:id', authMiddleware.checkAuthenticated, DadosCadastroController.getDadosCadastro);

// Rota para os dados cadastrais da empresa
router.get('/endpoints/dados-empresa/:id', authMiddleware.checkAuthenticated, DadosEmpresaController.getDadosEmpresa);

// Rota para os pins do usuário
router.get('/endpoints/pins-usuario/:id', authMiddleware.checkAuthenticated, PinsUsuarioController.getPinsUsuario);

// Rota para os rendimentos do usuário
router.get('/endpoints/rendimentos-usuario/:id', authMiddleware.checkAuthenticated, RendimentosUsuarioController.getRendimentosUsuario);

// Rota para o histórico de saques do usuário
router.get('/endpoints/saque-historico/:id', authMiddleware.checkAuthenticated, SaqueHistoricoUsuarioController.getSaqueHistoricoUsuario);

// Rota para o histórico de depositos do usuário
router.get('/endpoints/deposito-historico/:id', authMiddleware.checkAuthenticated, DepositoHistoricoUsuarioController.getDepositoHistoricoUsuario);

// Rota para carregar os saques pendentes do usuário
router.get('/endpoints/buscar-saques-pendentes/:id', authMiddleware.checkAuthenticated, BuscarSaquesPendentesUsuarioController.getSaquesPendentes);

// Rota para carregar os depósitos pendentes do usuário
router.get('/endpoints/buscar-depositos-pendentes/:id', authMiddleware.checkAuthenticated, BuscarDepositosPendentesUsuarioController.getDepositosPendentes);

//------------AÇÕES------------

// Rota para atualizar a assinatura de um cliente
router.put('/endpoints/atualizar-assinatura/:id', authMiddleware.checkAuthenticated, UpdateAssinaturaClienteController.updateAssinaturaCliente);

//  POST /endpoints/saque/:id   { amount: 100.50 }
router.post(
  '/endpoints/saque/:id',
  authMiddleware.checkAuthenticated,
  [
    param('id').isInt().withMessage('id deve ser inteiro'),
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount deve ser número > 0'),
  ],
  SaqueController.executeSaque
);

// Rota para cancelar uma solicitação de saque específica
router.post(
  '/endpoints/cancelar-saque/:id',
  authMiddleware.checkAuthenticated,
  [
    param('id').isInt().withMessage('O ID do saque deve ser um inteiro válido.'),
    body('motivo')
      .notEmpty()
      .withMessage('O motivo do cancelamento é obrigatório.')
      .isString()
      .withMessage('O motivo deve ser um texto válido.')
  ],
  CancelarSaqueController.cancelarSaque
);

//  POST /endpoints/deposito/:id   { amount: 100.50 }
router.post(
  '/endpoints/deposito/:id',
  authMiddleware.checkAuthenticated,
  [
    param('id').isInt().withMessage('id deve ser inteiro'),
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount deve ser número > 0'),
  ],
  DepositoController.executeDeposito
);

// Rota para cancelar uma solicitação de deposito específica
router.post(
  '/endpoints/cancelar-deposito/:id',
  authMiddleware.checkAuthenticated,
  [
    param('id').isInt().withMessage('O ID do depósito deve ser um inteiro válido.'),
    body('motivo')
      .notEmpty()
      .withMessage('O motivo do cancelamento é obrigatório.')
      .isString()
      .withMessage('O motivo deve ser um texto válido.')
  ],
  CancelarDepositoController.cancelarDeposito
);


module.exports = router;

