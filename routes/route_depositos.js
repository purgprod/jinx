// routes/route_depositos.js
const express = require('express');
const router = express.Router();
const BuscarDepositosPendentesController = require('../controllers/depositos/controller_buscar_depositos_pendentes');
const ExecutarDepositoController = require('../controllers/depositos/controller_deposito_executar.js');

// Rota para carregar a lista de depositos pendentes
router.get('/api/depositos/buscar-depositos-pendentes', BuscarDepositosPendentesController.getDepositosPendentes);

// Rota para executar um depósito pendente
router.post('/api/depositos/executar/:id', ExecutarDepositoController.execute);

module.exports = router;
