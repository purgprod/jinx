const express      = require('express');
const router       = express.Router();
const { body, param } = require('express-validator');
const authMiddleware  = require('../middleware/auth');

const StatusPinController         = require('../controllers/senha_negociacao/controller_status_pin');
const CriarPinController          = require('../controllers/senha_negociacao/controller_criar_pin');
const AlterarPinController        = require('../controllers/senha_negociacao/controller_alterar_pin');
const RecuperarSolicitarController = require('../controllers/senha_negociacao/controller_recuperar_solicitar');
const RecuperarConfirmarController = require('../controllers/senha_negociacao/controller_recuperar_confirmar');

const PIN_REGEX         = /^\d{4}$/;
const PIN_TODOS_IGUAIS  = /^(\d)\1{3}$/;

const validarPin = (campo, label) => [
    body(campo)
        .notEmpty().withMessage(`${label} é obrigatório.`)
        .matches(PIN_REGEX).withMessage(`${label} deve conter exatamente 4 dígitos numéricos.`)
        .custom((val) => {
            if (PIN_TODOS_IGUAIS.test(val)) throw new Error(`${label} não pode ter todos os dígitos iguais (ex: 1111).`);
            return true;
        }),
];

// Todas as rotas abaixo exigem sessão ativa
router.use('/api/v1/pin-negociacao/*', authMiddleware.checkAuthenticated);

// GET /api/v1/pin-negociacao/status/:id — verifica se o PIN já está cadastrado
router.get(
    '/api/v1/pin-negociacao/status/:id',
    [param('id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    StatusPinController.statusPin
);

// POST /api/v1/pin-negociacao/criar/:id — cria o PIN pela primeira vez
router.post(
    '/api/v1/pin-negociacao/criar/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        ...validarPin('pin', 'PIN'),
        ...validarPin('pin_confirmacao', 'Confirmação do PIN'),
    ],
    CriarPinController.criarPin
);

// PUT /api/v1/pin-negociacao/alterar/:id — troca o PIN (exige o PIN atual)
router.put(
    '/api/v1/pin-negociacao/alterar/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        body('pin_atual').notEmpty().withMessage('PIN atual é obrigatório.').matches(PIN_REGEX).withMessage('PIN atual inválido.'),
        ...validarPin('pin_novo', 'Novo PIN'),
        ...validarPin('pin_confirmacao', 'Confirmação do PIN'),
    ],
    AlterarPinController.alterarPin
);

// POST /api/v1/pin-negociacao/recuperar/solicitar/:id — solicita recuperação (exige senha de login)
router.post(
    '/api/v1/pin-negociacao/recuperar/solicitar/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        body('senha_login').notEmpty().withMessage('Senha de acesso é obrigatória.').isString(),
    ],
    RecuperarSolicitarController.recuperarSolicitar
);

// POST /api/v1/pin-negociacao/recuperar/confirmar — redefine o PIN usando o token do e-mail
// Não exige sessão: o token é o único autenticador
router.post(
    '/api/v1/pin-negociacao/recuperar/confirmar',
    [
        body('token').notEmpty().withMessage('Token de recuperação é obrigatório.').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Token inválido.'),
        ...validarPin('pin_novo', 'Novo PIN'),
        ...validarPin('pin_confirmacao', 'Confirmação do PIN'),
    ],
    RecuperarConfirmarController.recuperarConfirmar
);

module.exports = router;
