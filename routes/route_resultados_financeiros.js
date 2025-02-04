// routes/route_resultados_financeiros.js
const express = require('express');
const router = express.Router();
const ResultadosFinanceirosBuscarController = require('../controllers/resultados_financeiros/controller_buscar_resultados_financeiros');
const ResultadosFinanceirosUpdateController = require('../controllers/resultados_financeiros/controller_update_resultados_financeiros');
const ResultadosFinanceirosCriarController = require('../controllers/resultados_financeiros/controller_criar_resultados_financeiros');
const ResultadosFinanceirosInativarController = require('../controllers/resultados_financeiros/controller_inativar_resultados_financeiros');
const ResultadosFinanceirosAtivarController = require('../controllers/resultados_financeiros/controller_ativar_resultados_financeiros');

// Rota para carregar resultados financeiros
router.get('/api/resultados-financeiros', ResultadosFinanceirosBuscarController.getResultados);

// Rota para atualizar um resultado financeiro
router.put('/api/resultados-financeiros/:id', ResultadosFinanceirosUpdateController.updateResultado);

// Rota para criar um novo resultado financeiro
router.post('/api/resultados-financeiros', ResultadosFinanceirosCriarController.createResultado);

// Rota para inativar um resultado financeiro
router.put('/api/resultados-financeiros/:id/inativar', ResultadosFinanceirosInativarController.inativarResultado);

// Rota para ativar um resultado financeiro
router.put('/api/resultados-financeiros/:id/ativar', ResultadosFinanceirosAtivarController.ativarResultado);

module.exports = router;

