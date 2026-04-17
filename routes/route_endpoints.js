const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');

// IMPORTAÇÃO DOS VALIDADORES  <<<<<<<<<<
const { param, body, validationResult } = require('express-validator');

// Rate limiting para operações financeiras: máx. 5 por minuto por usuário
const financeiroLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req) => String(req.session?.user?.id ?? req.ip?.replace(/^::ffff:/, '') ?? 'unknown'),
    message: { error: 'Muitas requisições. Aguarde antes de tentar novamente.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
});

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
const TrocaSenhaController = require('../controllers/endpoints/controller_troca_senha');
const RecuperacaoSenhaController = require('../controllers/mailing/controller_recuperacao_de_senha');
const CadastroUsuarioController  = require('../controllers/endpoints/controller_cadastro_usuario');
const AtualizarPerfilController  = require('../controllers/endpoints/controller_atualizar_perfil');
const HistoricoPatrimonioController = require('../controllers/endpoints/controller_historico_patrimonio');
const HistoricoRendimentosController = require('../controllers/endpoints/controller_historico_rendimentos');
const RankingController              = require('../controllers/ranking/controller_ranking');
const CartaoController               = require('../controllers/endpoints/controller_cartao');

//------------ AUTENTICAÇÃO --------------//

// Rota para login - Não requer autenticação
router.post('/api/v1/login', AuthController.login);

// Rota para registro - Não requer autenticação
router.post('/api/v1/register', AuthController.register);

// Rota para cadastro de novo usuário - Não requer autenticação
router.post(
  '/api/v1/cadastro',
  [
    body('nome_completo')
      .notEmpty().withMessage('O nome completo é obrigatório.')
      .isString().withMessage('O nome completo deve ser um texto válido.')
      .isLength({ min: 3 }).withMessage('O nome completo deve ter no mínimo 3 caracteres.')
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/).withMessage('O nome completo deve conter apenas letras.'),
    body('cpf')
      .notEmpty().withMessage('O CPF é obrigatório.')
      .matches(/^\d{11}$/).withMessage('O CPF deve conter exatamente 11 dígitos numéricos.'),
    body('celular')
      .notEmpty().withMessage('O celular é obrigatório.')
      .matches(/^\d{10,11}$/).withMessage('O celular deve conter 10 ou 11 dígitos numéricos.'),
    body('email')
      .notEmpty().withMessage('O e-mail é obrigatório.')
      .isEmail().withMessage('Informe um e-mail válido.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('A senha é obrigatória.')
      .isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres.')
      .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula.')
      .matches(/[!@#$%*]/).withMessage('A senha deve conter pelo menos um caractere especial (! @ # $ % *).'),
  ],
  CadastroUsuarioController.cadastrarUsuario
);

// Rota para recuperação de senha - Não requer autenticação
router.post(
  '/api/v1/recuperar-senha',
  [
    body('email')
      .notEmpty().withMessage('O e-mail é obrigatório.')
      .isEmail().withMessage('Informe um e-mail válido.')
      .normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const resultado = await RecuperacaoSenhaController.fluxoRecuperacao(email);

    // Resposta genérica independente de o e-mail existir (evita enumeração)
    if (!resultado.usuarioEncontrado || resultado.sucesso) {
      return res.status(200).json({ success: true, message: 'Se o e-mail estiver cadastrado, você receberá a nova senha em breve.' });
    }

    return res.status(500).json({ success: false, message: 'Erro ao processar a solicitação.' });
  }
);

// Demais rotas requerem autenticação
router.use('/api/v1/*', authMiddleware.checkAuthenticated);

// Rota para logout
router.post('/api/v1/logout', authMiddleware.checkAuthenticated, AuthController.logout);

// Rota para check session
router.post('/api/v1/check-session', authMiddleware.checkAuthenticated, AuthController.checkSession);

//------------CONSULTAS------------

// Rota para o saldo do usuário
//router.get('/api/v1/saldo/:id', authMiddleware.checkAuthenticated, SaldoController.getSaldo);

// Rota para o valor investido do usuário
//router.get('/api/v1/investido/:id', authMiddleware.checkAuthenticated, InvestidoController.getInvestido);

// Rota para os emblemas do usuário
//router.get('/api/v1/emblemas/:id', authMiddleware.checkAuthenticated, EmblemasController.getEmblemas);

// Rota para a carteira do usuário
router.get('/api/v1/carteira/:id', authMiddleware.checkAuthenticated, CarteiraController.getCarteira);

// Rota para os dados cadastrais do usuário
router.get('/api/v1/dados-cadastro/:id', authMiddleware.checkAuthenticated, DadosCadastroController.getDadosCadastro);

// Rota para os dados cadastrais da empresa
router.get('/api/v1/dados-empresa/:id', authMiddleware.checkAuthenticated, DadosEmpresaController.getDadosEmpresa);

// Rota para os pins do usuário
router.get('/api/v1/pins-usuario/:id', authMiddleware.checkAuthenticated, PinsUsuarioController.getPinsUsuario);

// Rota para os rendimentos do usuário
router.get('/api/v1/rendimentos-usuario/:id', authMiddleware.checkAuthenticated, RendimentosUsuarioController.getRendimentosUsuario);

// Rota para o histórico de saques do usuário
router.get('/api/v1/saque-historico/:id', authMiddleware.checkAuthenticated, SaqueHistoricoUsuarioController.getSaqueHistoricoUsuario);

// Rota para o histórico de depositos do usuário
router.get('/api/v1/deposito-historico/:id', authMiddleware.checkAuthenticated, DepositoHistoricoUsuarioController.getDepositoHistoricoUsuario);

// Rota para o histórico de patrimônio do usuário (gráfico de crescimento)
router.get('/api/v1/historico-patrimonio/:id', authMiddleware.checkAuthenticated, HistoricoPatrimonioController.getHistoricoPatrimonio);

// Rota para o histórico de rendimentos do usuário (gráfico de crescimento)
router.get('/api/v1/historico-rendimentos/:id', authMiddleware.checkAuthenticated, HistoricoRendimentosController.getHistoricoRendimentos);

// Rota para o ranking de pontos (todos os usuários com pontuação > 0)
router.get('/api/v1/ranking', authMiddleware.checkAuthenticated, RankingController.getRanking);

// Rota para carregar os saques pendentes do usuário
router.get('/api/v1/buscar-saques-pendentes/:id', authMiddleware.checkAuthenticated, BuscarSaquesPendentesUsuarioController.getSaquesPendentes);

// Rota para carregar os depósitos pendentes do usuário
router.get('/api/v1/buscar-depositos-pendentes/:id', authMiddleware.checkAuthenticated, BuscarDepositosPendentesUsuarioController.getDepositosPendentes);

//------------AÇÕES------------

// Rota para atualizar a assinatura de um cliente
router.put('/api/v1/atualizar-assinatura/:id', authMiddleware.checkAuthenticated, UpdateAssinaturaClienteController.updateAssinaturaCliente);

// Rota para atualizar dados de perfil do usuário
router.put(
  '/api/v1/edita-perfil/:id',
  authMiddleware.checkAuthenticated,
  [
    param('id').isInt({ gt: 0 }).withMessage('O ID deve ser um inteiro válido.'),
    body('nome_completo')
      .optional()
      .isString().withMessage('O nome completo deve ser um texto válido.')
      .isLength({ min: 3 }).withMessage('O nome completo deve ter no mínimo 3 caracteres.')
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/).withMessage('O nome completo deve conter apenas letras.'),
    body('celular')
      .optional()
      .matches(/^\d{10,11}$/).withMessage('O celular deve conter 10 ou 11 dígitos numéricos.'),
    body('cep')
      .optional()
      .matches(/^\d{8}$/).withMessage('O CEP deve conter exatamente 8 dígitos numéricos.'),
    body('logradouro')
      .optional()
      .isString().withMessage('O logradouro deve ser um texto válido.')
      .notEmpty().withMessage('O logradouro não pode ser vazio.'),
    body('numero_da_rua')
      .optional()
      .isString().withMessage('O número deve ser um texto válido.')
      .notEmpty().withMessage('O número não pode ser vazio.'),
    body('complemento')
      .optional()
      .isString().withMessage('O complemento deve ser um texto válido.'),
    body('pix_cpf')
      .optional()
      .matches(/^\d{11}$/).withMessage('O CPF Pix deve conter exatamente 11 dígitos numéricos.'),
    body('pix_celular')
      .optional()
      .matches(/^\d{10,11}$/).withMessage('O celular Pix deve conter 10 ou 11 dígitos numéricos.'),
    body('pix_email')
      .optional()
      .isEmail().withMessage('Informe um e-mail Pix válido.')
      .normalizeEmail(),
    body('pix_chave')
      .optional()
      .isString().withMessage('A chave Pix deve ser um texto válido.')
      .notEmpty().withMessage('A chave Pix não pode ser vazia.'),
  ],
  AtualizarPerfilController.atualizarPerfil
);

// Rota para troca de senha do usuário
router.put(
  '/api/v1/troca-senha/:id',
  authMiddleware.checkAuthenticated,
  [
    param('id').isInt({ gt: 0 }).withMessage('O ID deve ser um inteiro válido.'),
    body('senhaAtual')
      .notEmpty().withMessage('A senha atual é obrigatória.')
      .isString().withMessage('A senha atual deve ser um texto válido.'),
    body('novaSenha')
      .notEmpty().withMessage('A nova senha é obrigatória.')
      .isLength({ min: 8 }).withMessage('A nova senha deve ter no mínimo 8 caracteres.')
      .matches(/[A-Z]/).withMessage('A nova senha deve conter pelo menos uma letra maiúscula.')
      .matches(/[!@#$%*]/).withMessage('A nova senha deve conter pelo menos um caractere especial (! @ # $ % *).'),
  ],
  TrocaSenhaController.trocarSenha
);

//  POST /endpoints/saque/:id   { amount: 100.50 }
router.post(
  '/api/v1/saque/:id',
  authMiddleware.checkAuthenticated,
  financeiroLimiter,
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
  '/api/v1/cancelar-saque/:id',
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
  '/api/v1/deposito/:id',
  authMiddleware.checkAuthenticated,
  financeiroLimiter,
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
  '/api/v1/cancelar-deposito/:id',
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

//------------CARTÃO DE CRÉDITO------------

// Salva (ou substitui) o token do cartão de crédito do usuário
router.post(
  '/api/v1/cartao/:id',
  authMiddleware.checkAuthenticated,
  [
    param('id').isInt({ gt: 0 }).withMessage('O ID deve ser um inteiro válido.'),
    body('payment_token').notEmpty().withMessage('payment_token é obrigatório.').isString()
  ],
  CartaoController.salvarCartao
);

// Retorna os dados públicos do cartão ativo (sem token)
router.get(
  '/api/v1/cartao/:id',
  authMiddleware.checkAuthenticated,
  [param('id').isInt({ gt: 0 }).withMessage('O ID deve ser um inteiro válido.')],
  CartaoController.buscarCartao
);

// Remove o cartão cadastrado
router.delete(
  '/api/v1/cartao/:id',
  authMiddleware.checkAuthenticated,
  [param('id').isInt({ gt: 0 }).withMessage('O ID deve ser um inteiro válido.')],
  CartaoController.removerCartao
);

module.exports = router;

