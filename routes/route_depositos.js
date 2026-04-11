// routes/route_depositos.js
const express = require('express');
const router  = express.Router();

const BuscarDepositosPendentesController = require('../controllers/depositos/controller_buscar_depositos_pendentes');
const ExecutarDepositoController         = require('../controllers/depositos/controller_deposito_executar.js');
const WebhookPixEfiController            = require('../controllers/depositos/controller_webhook_pix_efi');

// Rota para carregar a lista de depósitos pendentes (painel Jinx)
router.get('/api/depositos/buscar-depositos-pendentes', BuscarDepositosPendentesController.getDepositosPendentes);

// Rota para executar um depósito pendente manualmente (painel Jinx)
router.post('/api/depositos/executar/:id', ExecutarDepositoController.execute);

// Webhook Efí Bank — sem autenticação de sessão (chamado diretamente pelo Efí)
// Validação feita internamente via token no header 'x-efi-webhook-token'
router.post('/api/pix/webhook', express.json(), WebhookPixEfiController.receberWebhook);

module.exports = router;
