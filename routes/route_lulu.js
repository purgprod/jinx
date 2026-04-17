// routes/route_lulu.js
const express = require('express');
const router  = express.Router();
const { checkAuthenticated } = require('../middleware/auth');
const LuluDashboardController = require('../controllers/lulu/controller_lulu_dashboard');

router.use('/api/lulu', checkAuthenticated);

router.get('/api/lulu/resumo',    LuluDashboardController.getResumo);
router.get('/api/lulu/historico', LuluDashboardController.getHistorico);
router.get('/api/lulu/top10',     LuluDashboardController.getTop10);
router.get('/api/lulu/config',    LuluDashboardController.getConfig);
router.put('/api/lulu/config',    LuluDashboardController.updateConfig);

module.exports = router;
