const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');
const authMiddleware    = require('../middleware/auth');
const BiometriaController = require('../controllers/endpoints/controller_biometria');

// ─────────────────────────────────────────────────────────────
//  CADASTRO DE BIOMETRIA (requer sessão autenticada)
// ─────────────────────────────────────────────────────────────

// Gera as opções de registro para o dispositivo
router.post(
    '/api/v1/biometria/cadastro/iniciar',
    authMiddleware.checkAuthenticated,
    BiometriaController.cadastroIniciar
);

// Recebe e verifica a resposta do dispositivo, persiste a credencial
router.post(
    '/api/v1/biometria/cadastro/concluir',
    authMiddleware.checkAuthenticated,
    BiometriaController.cadastroConcluir
);

// ─────────────────────────────────────────────────────────────
//  LOGIN BIOMÉTRICO (rotas públicas — criam a sessão)
// ─────────────────────────────────────────────────────────────

// Recebe o e-mail e retorna o desafio de autenticação
router.post(
    '/api/v1/biometria/login/iniciar',
    [
        body('email')
            .isEmail().withMessage('E-mail inválido')
            .normalizeEmail({ gmail_remove_dots: false })
    ],
    BiometriaController.loginIniciar
);

// Verifica a assinatura do dispositivo e abre a sessão
router.post(
    '/api/v1/biometria/login/concluir',
    BiometriaController.loginConcluir
);

module.exports = router;
