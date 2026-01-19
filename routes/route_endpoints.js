const express = require('express');
const router  = express.Router();

// IMPORTAÇÃO DOS VALIDADORES  <<<<<<<<<<
const { param, body } = require('express-validator');

//const SaldoController     = require('../controllers/endpoints/controller_saldo');
//const InvestidoController = require('../controllers/endpoints/controller_investido');
//const EmblemasController  = require('../controllers/endpoints/controller_emblemas');
const SaqueController     = require('../controllers/endpoints/controller_saque');
const CarteiraController     = require('../controllers/endpoints/controller_carteira');
const DadosCadastroController     = require('../controllers/endpoints/controller_dados_cadastro');
const DadosEmpresaController     = require('../controllers/endpoints/controller_dados_empresa');
const PinsUsuarioController     = require('../controllers/endpoints/controller_pins_usuario');
const RendimentosUsuarioController     = require('../controllers/endpoints/controller_rendimentos_usuario');
const AuthController = require('../controllers/endpoints/controller_autenticacao_purg');
const authMiddleware = require('../middleware/auth'); // Importa o middleware de autenticação

//------------ AUTENTICAÇÃO --------------//

// Rota para login - Não requer autenticação
router.post('/endpoints/login', AuthController.login);

// Rota para registro - Não requer autenticação
router.post('/endpoints/register', AuthController.register);

// Demais rotas requerem autenticação
router.use('/endpoints/*', (req, res, next) => {
    if (req.path === '/endpoints/login' || req.path === '/endpoints/register') {
        next(); // Isenta login e register do middleware de autenticação
    } else {
        authMiddleware.checkAuthenticated(req, res, next); // Aplica o middleware
    }
});

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

//------------AÇÕES------------
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

module.exports = router;

