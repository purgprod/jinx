// routes/route_resultados_financeiros.js
const express = require('express');
const router = express.Router();
const ResultadosFinanceirosController = require('../controllers/controller_resultados_financeiros');
// const ResultadosFinanceirosDetalhesController = require('../controllers/controller_resultados_financeiros_detalhes');

// Rota para carregar resultados financeiros
router.get('/api/resultados-financeiros', ResultadosFinanceirosController.getResultados);


// Rota para carregar os detalhes de um resultado financeiro
router.get('/api/resultados-financeiros-detalhes', ResultadosFinanceirosController.getResultados);

module.exports = router;

