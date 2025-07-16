// routes/route_emblemas.js
const express = require('express');
const router = express.Router();
const PorcentagemEmblemasBuscarController = require('../controllers/emblemas/controller_buscar_porcentagem_emblemas');
const UpdatePorcentagemEmblemasController = require('../controllers/emblemas/controller_update_porcentagem_emblemas');
const EmblemasTotalController = require('../controllers/emblemas/controller_buscar_emblemas_total');
const PagamentosEmblemasTotalController = require('../controllers/emblemas/controller_buscar_pagamento_emblemas_total');
const PagamentosEmblemasHistoricosController = require('../controllers/emblemas/controller_buscar_pagamento_emblemas_historicos');
const BuscarEmblemasTotaisHistoricosController = require('../controllers/emblemas/controller_buscar_total_emblemas_historicos');

// Rota para carregar o valor pago em porcentagem em emblemas sobre o saldo
router.get('/api/emblemas/buscar-porcentagem', PorcentagemEmblemasBuscarController.getPorcentagem);

// Rota para atualizar a porcentagem do valor pago em porcentagem em emblemas
router.put('/api/emblemas/atualizar-porcentagem', UpdatePorcentagemEmblemasController.updatePorcentagem);

// Rota para obter os dados totais dos emblemas
router.get('/api/emblemas/:id/dados-emblemas-total', EmblemasTotalController.getEmblemasTotal);

// Rota para obter os dados de pagamento dos emblemas totais
router.get('/api/emblemas/:id/dados-pagamentos-emblemas-total', PagamentosEmblemasTotalController.getPagamentosEmblemasTotal);

// Rota para obter os dados de pagamento dos emblemas historicos
router.get('/api/emblemas/:id/dados-pagamentos-emblemas-historicos', PagamentosEmblemasHistoricosController.getPagamentosEmblemasHistoricos);

// Rota para obter os dados históricos totais dos emblemas
router.get('/api/emblemas/:id/dados-emblemas-totais-historicos', BuscarEmblemasTotaisHistoricosController.getEmblemasHistoricos);

module.exports = router;
