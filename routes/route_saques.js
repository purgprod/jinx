// routes/route_emblemas.js
const express = require('express');
const router = express.Router();
const BuscarSaquesPendentesController = require('../controllers/saques/controller_buscar_saques_pendentes');
//const UpdateSaquesExecutadoController = require('../controllers/saques/controller_update_saques_executado');

// Rota para carregar a lista de saques pendentes
router.get('/api/saques/buscar-saques-pendentes', BuscarSaquesPendentesController.getSaquesPendentes);

module.exports = router;
