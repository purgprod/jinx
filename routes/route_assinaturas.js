// routes/route_assinaturas.js
const express = require('express');
const router = express.Router();
const PorcentagemAssinaturasBuscarController = require('../controllers/assinaturas/controller_buscar_porcentagem_assinaturas');
const UpdatePorcentagemAssinaturasController = require('../controllers/assinaturas/controller_update_porcentagem_assinaturas');
const PagamentosAssinaturasHistoricoController = require('../controllers/assinaturas/controller_buscar_pagamento_assinaturas_historicos_ecossistema');
const PagamentosAssinaturasTotalController = require('../controllers/assinaturas/controller_buscar_pagamento_assinaturas_total');

// Rota para carregar o valor cobrado em porcentagem dos rendimentos das assinaturas
router.get('/api/assinaturas/buscar-porcentagem', PorcentagemAssinaturasBuscarController.getPorcentagem);

// Rota para atualizar a porcentagem do valor cobrado dos rendimentos
router.put('/api/assinaturas/atualizar-porcentagem', UpdatePorcentagemAssinaturasController.updatePorcentagem);

// Rota para obter os dados de pagamento das assinaturas históricos do ecossistema
router.get('/api/assinaturas/:id/dados-pagamentos-assinaturas-historicos', PagamentosAssinaturasHistoricoController.getPagamentosAssinaturasHistoricos);

// Rota para obter os dados de pagamento das assinaturas total
router.get('/api/assinaturas/:id/dados-pagamentos-assinaturas-total', PagamentosAssinaturasTotalController.getPagamentosAssinaturasTotal);

module.exports = router;

