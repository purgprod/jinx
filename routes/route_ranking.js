// routes/route_ranking.js

'use strict';

const express               = require('express');
const router                = express.Router();
const { param }             = require('express-validator');
const authMiddleware        = require('../middleware/auth');
const RankingController     = require('../controllers/ranking/controller_ranking');
const RankingDadosController = require('../controllers/ranking/controller_ranking_dados');

router.use('/api/v1/ranking/*', authMiddleware.checkAuthenticated);

router.get('/api/ranking', authMiddleware.checkAuthenticated, RankingController.getRanking);

// GET /api/v1/ranking/dados/:usuario_id — dados públicos não sensíveis de um usuário no ranking
router.get(
    '/api/v1/ranking/dados/:usuario_id',
    [param('usuario_id').isInt({ gt: 0 }).withMessage('usuario_id inválido.')],
    RankingDadosController.getDadosUsuario
);

module.exports = router;
