// routes/route_endpoints.js

const express = require('express');
const router = express.Router();
const SaldoController = require('../controllers/endpoints/controller_saldo');
const InvestidoController = require('../controllers/endpoints/controller_investido');
const EmblemasController = require('../controllers/endpoints/controller_emblemas');

// Rota para obter os dados de saldo do usuário
router.get('/endpoints/saldo/:id', SaldoController.getSaldo);

// Rota para obter os dados de investido do usuário
router.get('/endpoints/investido/:id', InvestidoController.getInvestido);

// Rota para obter os dados de emblemas do usuário
router.get('/endpoints/emblemas/:id', EmblemasController.getEmblemas);

module.exports = router;

