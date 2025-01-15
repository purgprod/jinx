// routes/route_resultados_financeiros.js
const express = require('express');
const router = express.Router();
const ResultadosFinanceirosController = require('../controllers/controller_resultados_financeiros'); // com a grafia correta

// Rota para carregar resultados financeiros
router.get('/api/resultados-financeiros', ResultadosFinanceirosController.getResultados);

module.exports = router;

