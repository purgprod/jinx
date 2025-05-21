// routes/route_assinaturas.js
const express = require('express');
const router = express.Router();
const PorcentagemAssinaturasBuscarController = require('../controllers/assinaturas/controller_buscar_porcentagem_assinaturas');
const UpdatePorcentagemAssinaturasController = require('../controllers/assinaturas/controller_update_porcentagem_assinaturas');
const PagamentosAssinaturasHistoricoController = require('../controllers/assinaturas/controller_buscar_pagamento_assinaturas_historicos');
const PagamentosAssinaturasTotalController = require('../controllers/assinaturas/controller_buscar_pagamento_assinaturas_total');
const PlanosAssinaturasHistoricoController = require('../controllers/assinaturas/controller_buscar_planos_assinaturas_historicos');
const UpdateAssinaturaClienteController = require('../controllers/assinaturas/controller_update_assinatura_cliente');

// Rota para carregar o valor cobrado em porcentagem dos rendimentos das assinaturas
router.get('/api/assinaturas/buscar-porcentagem', PorcentagemAssinaturasBuscarController.getPorcentagem);

// Rota para atualizar a porcentagem do valor cobrado dos rendimentos
router.put('/api/assinaturas/atualizar-porcentagem', UpdatePorcentagemAssinaturasController.updatePorcentagem);

// Rota para obter os dados de pagamento das assinaturas históricos
router.get('/api/assinaturas/:id/dados-pagamentos-assinaturas-historicos', PagamentosAssinaturasHistoricoController.getPagamentosAssinaturasHistoricos);

// Rota para obter os dados de pagamento das assinaturas total
router.get('/api/assinaturas/:id/dados-pagamentos-assinaturas-total', PagamentosAssinaturasTotalController.getPagamentosAssinaturasTotal);

// Rota para obter os dados de planos das assinaturas históricos
router.get('/api/assinaturas/dados-planos-assinaturas-historicos', PlanosAssinaturasHistoricoController.getPlanosAssinaturasHistoricos);

// Rota para atualizar a assinatura de um cliente
router.put('/api/assinaturas/atualizar-assinatura/:id', UpdateAssinaturaClienteController.updateAssinaturaCliente);

module.exports = router;

