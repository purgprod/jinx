// routes/route_depositos.js
const express = require('express');
const router = express.Router();
const BuscarDepositosPendentesController = require('../controllers/depositos/controller_buscar_depositos_pendentes');
//const UpdateSaquesExecutadoController = require('../controllers/depositos/controller_update_saques_executado');

// Rota para carregar a lista de depositos pendentes
router.get('/api/depositos/buscar-depositos-pendentes', BuscarDepositosPendentesController.getDepositosPendentes);

module.exports = router;
