// routes/route_ecossistema.js

const express = require('express');
const router = express.Router();
const PurgTokensController = require('../controllers/ecossistema/controller_tokens_purg');
const PurgDadosFinanceirosController = require('../controllers/ecossistema/controller_dadosfinanceiros_purg');
const PurgDadosFinanceirosHistoricosController = require('../controllers/ecossistema/controller_dadosfinanceiroshistoricos_purg');
const PurgDadosRendimentosHistoricosController = require('../controllers/ecossistema/controller_dadosrendimentoshistoricos_purg');
const EcossistemaTokensController = require('../controllers/ecossistema/controller_tokens_ecossistema');
const EcossistemaDadosFinanceirosController = require('../controllers/ecossistema/controller_dadosfinanceiros_ecossistema');
const EcossistemaDadosFinanceirosHistoricosController = require('../controllers/ecossistema/controller_dadosfinanceiroshistoricos_ecossistema');
const EcossistemaDadosRendimentosHistoricosController = require('../controllers/ecossistema/controller_dadosrendimentoshistoricos_ecossistema');
const EcossistemaSaquesController = require('../controllers/ecossistema/controller_saques_ecossistema');
const EcossistemaDepositosController = require('../controllers/ecossistema/controller_depositos_ecossistema');


// Rota para obter o total de saques do ecossistema
router.get('/api/ecossistema/:id/dados-saques', EcossistemaSaquesController.getSaques);

// Rota para obter o total de depositos do ecossistema
router.get('/api/ecossistema/:id/dados-depositos', EcossistemaDepositosController.getDepositos);

// Rota para obter tokens do ecossistema
router.get('/api/ecossistema/:id/tokens', EcossistemaTokensController.getUserTokens);

// Rota para obter os últimos dados financeiros do ecossistema
router.get('/api/ecossistema/:id/ultimos-dados-financeiros', EcossistemaDadosFinanceirosController.getUltimosDadosFinanceiros);

// Rota para obter os dados de valor de carteira históricos do ecossistema
router.get('/api/ecossistema/:id/dados-financeiros-historicos', EcossistemaDadosFinanceirosHistoricosController.getDadosFinanceirosHistoricos);

// Rota para obter os dados de rendimentos históricos do ecossistema
router.get('/api/ecossistema/:id/dados-financeiros-rendimentos-historicos', EcossistemaDadosRendimentosHistoricosController.getDadosRendimentosHistoricos);

// Rota para obter tokens da Purg
router.get('/api/purg/:id/tokens', PurgTokensController.getUserTokens);

// Rota para obter os últimos dados financeiros da Purg
router.get('/api/purg/:id/ultimos-dados-financeiros', PurgDadosFinanceirosController.getUltimosDadosFinanceiros);

// Rota para obter os dados de valor de carteira históricos da Purg
router.get('/api/purg/:id/dados-financeiros-historicos', PurgDadosFinanceirosHistoricosController.getDadosFinanceirosHistoricos);

// Rota para obter os dados de rendimentos históricos da Purg
router.get('/api/purg/:id/dados-financeiros-rendimentos-historicos', PurgDadosRendimentosHistoricosController.getDadosRendimentosHistoricos);


module.exports = router;

