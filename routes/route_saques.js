// routes/route_emblemas.js
const express = require('express');
const router = express.Router();
const BuscarSaquesPendentesController = require('../controllers/saques/controller_buscar_saques_pendentes');
const ExecutarSaqueController = require('../controllers/saques/controller_saque_executar.js');

// Rota para carregar a lista de saques pendentes
router.get('/api/saques/buscar-saques-pendentes', BuscarSaquesPendentesController.getSaquesPendentes);

// Rota para executar um saque pendente
router.post('/api/saques/executar/:id', ExecutarSaqueController.execute);

module.exports = router;
