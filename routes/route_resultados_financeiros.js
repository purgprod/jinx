// routes/route_resultados_financeiros.js
const express = require('express');
const router = express.Router();
const ResultadosFinanceirosController = require('../controllers/controller_resultados_financeiros');

// Rota para carregar resultados financeiros
router.get('/api/resultados-financeiros', ResultadosFinanceirosController.getResultados);

// Rota para atualizar um resultado financeiro
router.put('/api/resultados-financeiros/:id', ResultadosFinanceirosController.updateResultado);

module.exports = router;

