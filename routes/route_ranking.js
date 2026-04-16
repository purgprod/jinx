// routes/route_ranking.js

'use strict';

const express          = require('express');
const router           = express.Router();
const authMiddleware   = require('../middleware/authMiddleware');
const RankingController = require('../controllers/ranking/controller_ranking');

// Somente usuários autenticados no painel Jinx podem consultar o ranking
router.get('/api/ranking', authMiddleware.checkAuthenticated, RankingController.getRanking);

module.exports = router;
