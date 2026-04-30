const express      = require('express');
const router       = express.Router();
const { body, param } = require('express-validator');
const authMiddleware          = require('../middleware/auth');
const verificarSenhaNegociacao = require('../middleware/verificar_senha_negociacao');

const StatusSenhaController        = require('../controllers/senha_negociacao/controller_status_senha');
const CriarSenhaController         = require('../controllers/senha_negociacao/controller_criar_senha');
const AlterarSenhaController       = require('../controllers/senha_negociacao/controller_alterar_senha');
const RecuperarSolicitarController = require('../controllers/senha_negociacao/controller_recuperar_solicitar');
const RecuperarConfirmarController = require('../controllers/senha_negociacao/controller_recuperar_confirmar');

const SENHA_REGEX        = /^\d{4}$/;
const SENHA_TODOS_IGUAIS = /^(\d)\1{3}$/;

const validarSenha = (campo, label) => [
    body(campo)
        .notEmpty().withMessage(`${label} é obrigatória.`)
        .matches(SENHA_REGEX).withMessage(`${label} deve conter exatamente 4 dígitos numéricos.`)
        .custom((val) => {
            if (SENHA_TODOS_IGUAIS.test(val)) throw new Error(`${label} não pode ter todos os dígitos iguais (ex: 1111).`);
            return true;
        }),
];

// Todas as rotas abaixo exigem sessão ativa
router.use('/api/v1/senha-negociacao/*', authMiddleware.checkAuthenticated);

// POST /api/v1/senha-negociacao/validar/:id — valida a Senha de Negociação sem executar nenhuma ação
router.post(
    '/api/v1/senha-negociacao/validar/:id',
    [param('id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    verificarSenhaNegociacao,
    (req, res) => res.status(200).json({ success: true, message: 'Senha de Negociação válida.' })
);

// GET /api/v1/senha-negociacao/status/:id — verifica se a Senha de Negociação já está cadastrada
router.get(
    '/api/v1/senha-negociacao/status/:id',
    [param('id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    StatusSenhaController.statusSenha
);

// POST /api/v1/senha-negociacao/criar/:id — cria a Senha de Negociação pela primeira vez
router.post(
    '/api/v1/senha-negociacao/criar/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        ...validarSenha('senha', 'Senha de Negociação'),
        ...validarSenha('senha_confirmacao', 'Confirmação da Senha de Negociação'),
    ],
    CriarSenhaController.criarSenha
);

// PUT /api/v1/senha-negociacao/alterar/:id — troca a Senha de Negociação (exige a senha atual)
router.put(
    '/api/v1/senha-negociacao/alterar/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        body('senha_atual').notEmpty().withMessage('Senha de Negociação atual é obrigatória.').matches(SENHA_REGEX).withMessage('Senha de Negociação atual inválida.'),
        ...validarSenha('senha_nova', 'Nova Senha de Negociação'),
        ...validarSenha('senha_confirmacao', 'Confirmação da Senha de Negociação'),
    ],
    AlterarSenhaController.alterarSenha
);

// POST /api/v1/senha-negociacao/recuperar/solicitar/:id — solicita recuperação (exige senha de login)
router.post(
    '/api/v1/senha-negociacao/recuperar/solicitar/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        body('senha_login').notEmpty().withMessage('Senha de acesso é obrigatória.').isString(),
    ],
    RecuperarSolicitarController.recuperarSolicitar
);

// POST /api/v1/senha-negociacao/recuperar/confirmar — redefine a Senha de Negociação usando o token do e-mail
// Não exige sessão: o token é o único autenticador
router.post(
    '/api/v1/senha-negociacao/recuperar/confirmar',
    [
        body('token').notEmpty().withMessage('Token de recuperação é obrigatório.').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Token inválido.'),
        ...validarSenha('senha_nova', 'Nova Senha de Negociação'),
        ...validarSenha('senha_confirmacao', 'Confirmação da Senha de Negociação'),
    ],
    RecuperarConfirmarController.recuperarConfirmar
);

module.exports = router;
