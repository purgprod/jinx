// routes/route_objetivos.js
// Rotas da Engine de Objetivos, Metas e Pontuação.
//
// Todas as rotas requerem autenticação de sessão.
// Ownership é verificado dentro de cada controller (session.user.id === :id).

'use strict';

const express      = require('express');
const router       = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const ListarObjetivosController    = require('../controllers/objetivos/controller_listar_objetivos');
const DetalharObjetivoController   = require('../controllers/objetivos/controller_detalhar_objetivo');
const CriarObjetivoController      = require('../controllers/objetivos/controller_criar_objetivo');
const EditarObjetivoController     = require('../controllers/objetivos/controller_editar_objetivo');
const CancelarObjetivoController   = require('../controllers/objetivos/controller_cancelar_objetivo');

// Todas as rotas abaixo exigem sessão ativa
router.use('/api/v1/objetivos/*', authMiddleware.checkAuthenticated);

// ─── LISTAR ──────────────────────────────────────────────────────────────────
// GET /api/v1/objetivos/:id
// Retorna todos os objetivos do usuário com resumo de progresso e pontos.
router.get(
    '/api/v1/objetivos/:id',
    authMiddleware.checkAuthenticated,
    [param('id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    ListarObjetivosController.execute
);

// ─── DETALHAR ─────────────────────────────────────────────────────────────────
// GET /api/v1/objetivos/:id/:objetivo_id
// Retorna um objetivo com todas as metas e percentuais de atingimento.
router.get(
    '/api/v1/objetivos/:id/:objetivo_id',
    authMiddleware.checkAuthenticated,
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        param('objetivo_id').isInt({ gt: 0 }).withMessage('objetivo_id inválido.'),
    ],
    DetalharObjetivoController.execute
);

// ─── CRIAR OBJETIVO SECUNDÁRIO ───────────────────────────────────────────────
// POST /api/v1/objetivos/:id
// Cria um novo objetivo (não-Patrimônio) com metas geradas automaticamente.
router.post(
    '/api/v1/objetivos/:id',
    authMiddleware.checkAuthenticated,
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        body('descricao')
            .notEmpty().withMessage('Descrição é obrigatória.')
            .isString()
            .isLength({ min: 3, max: 255 }).withMessage('Descrição entre 3 e 255 caracteres.'),
        body('valor_alvo')
            .isFloat({ gt: 0 }).withMessage('valor_alvo deve ser número > 0.'),
        body('prazo')
            .isInt({ min: 1, max: 600 }).withMessage('Prazo entre 1 e 600 meses.'),
        body('pontos_total')
            .isInt({ min: 0 }).withMessage('pontos_total deve ser inteiro >= 0.'),
        body('aporte_inicial')
            .optional()
            .isFloat({ gt: 0 }).withMessage('aporte_inicial deve ser número > 0.'),
    ],
    CriarObjetivoController.execute
);

// ─── CONFIGURAR PATRIMÔNIO ───────────────────────────────────────────────────
// POST /api/v1/objetivos/:id/patrimonio
// Configura (ou reconfigura sem saldo) as metas do Patrimônio.
router.post(
    '/api/v1/objetivos/:id/patrimonio',
    authMiddleware.checkAuthenticated,
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        body('valor_alvo')
            .isFloat({ gt: 0 }).withMessage('valor_alvo deve ser número > 0.'),
        body('prazo')
            .isInt({ min: 1, max: 600 }).withMessage('Prazo entre 1 e 600 meses.'),
        body('pontos_total')
            .isInt({ min: 0 }).withMessage('pontos_total deve ser inteiro >= 0.'),
    ],
    CriarObjetivoController.configurarPatrimonio
);

// ─── EDITAR ───────────────────────────────────────────────────────────────────
// PUT /api/v1/objetivos/:id/:objetivo_id
// Edita descrição, prazo ou valor_alvo (apenas para valores maiores que o atual).
// Mudança de prazo ou valor_alvo dispara recalculation_job.
router.put(
    '/api/v1/objetivos/:id/:objetivo_id',
    authMiddleware.checkAuthenticated,
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        param('objetivo_id').isInt({ gt: 0 }).withMessage('objetivo_id inválido.'),
        body('descricao').optional().isString().isLength({ min: 3, max: 255 }),
        body('prazo').optional().isInt({ min: 1, max: 600 }),
        body('valor_alvo').optional().isFloat({ min: 0.01 }).withMessage('valor_alvo deve ser um número positivo.'),
    ],
    EditarObjetivoController.execute
);

// ─── CANCELAR ─────────────────────────────────────────────────────────────────
// DELETE /api/v1/objetivos/:id/:objetivo_id
// Cancela um objetivo secundário (Patrimônio não pode ser cancelado).
router.delete(
    '/api/v1/objetivos/:id/:objetivo_id',
    authMiddleware.checkAuthenticated,
    [
        param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        param('objetivo_id').isInt({ gt: 0 }).withMessage('objetivo_id inválido.'),
    ],
    CancelarObjetivoController.execute
);

module.exports = router;
