// routes/route_assinaturas.js
const express = require('express');
const router = express.Router();
const { checkAuthenticated } = require('../middleware/auth');
const PorcentagemAssinaturasBuscarController = require('../controllers/assinaturas/controller_buscar_porcentagem_assinaturas');
const UpdatePorcentagemAssinaturasController = require('../controllers/assinaturas/controller_update_porcentagem_assinaturas');
const PagamentosAssinaturasHistoricoController = require('../controllers/assinaturas/controller_buscar_pagamento_assinaturas_historicos');
const PagamentosAssinaturasTotalController = require('../controllers/assinaturas/controller_buscar_pagamento_assinaturas_total');
const PlanosAssinaturasHistoricoController = require('../controllers/assinaturas/controller_buscar_planos_assinaturas_historicos');
const UpdateAssinaturaClienteController = require('../controllers/assinaturas/controller_update_assinatura_cliente');
const UsuariosProTotalController = require('../controllers/assinaturas/controller_buscar_usuarios_pro_total');
const UsuariosBasicTotalController = require('../controllers/assinaturas/controller_buscar_usuarios_basic_total');

// Todas as rotas de assinaturas requerem autenticação
router.use('/api/assinaturas', checkAuthenticated);

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

// Rota para obter o total de usuarios Poppy Pro total
router.get('/api/assinaturas/dados-total-usuarios-pro', UsuariosProTotalController.getUsuariosProTotal);

// Rota para obter o total de usuarios Poppy Basic total
router.get('/api/assinaturas/dados-total-usuarios-basic', UsuariosBasicTotalController.getUsuariosBasicTotal);

module.exports = router;

