const express = require('express');
const router  = express.Router();
const authWebhook = require('../middleware/auth_webhook');
const RelatorioGerencialController = require('../controllers/webhook/controller_relatorio_gerencial');
const NamiController = require('../controllers/webhook/controller_nami');

router.get('/api/webhook/relatorio-gerencial', authWebhook, RelatorioGerencialController.getRelatorio);

router.get('/api/webhook/nami/pendentes',                 authWebhook, NamiController.getPendentes);
router.put('/api/webhook/nami/:id/enviado',              authWebhook, NamiController.marcarEnviado);
router.put('/api/webhook/nami/:id/falhou',               authWebhook, NamiController.marcarFalhou);
router.post('/api/webhook/nami/verificar-metas-mensais',       authWebhook, NamiController.verificarMetasMensais);
router.get('/api/webhook/nami/usuarios/por-celular',           authWebhook, NamiController.buscarPorCelular);
router.put('/api/webhook/nami/usuarios/:usuario_id/toggle',    authWebhook, NamiController.toggleNami);

module.exports = router;
