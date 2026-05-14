const express = require('express');
const router = express.Router();
const AdminDebugController   = require('../controllers/admin/controller_admin_debug');
const AdminFamiliaController = require('../controllers/admin/controller_admin_familia');
const AdminTaxaCdiController = require('../controllers/admin/controller_admin_taxa_cdi');

router.get('/api/admin/debug/status', AdminDebugController.getStatus);
router.post('/api/admin/debug/toggle', AdminDebugController.toggle);

router.get('/api/admin/familia/vinculos', AdminFamiliaController.listarVinculos);
router.get('/api/admin/familia/convites', AdminFamiliaController.listarConvites);
router.delete('/api/admin/familia/vinculos/:guardiao_id/:tutelado_id', AdminFamiliaController.revogarVinculo);
router.put('/api/admin/familia/convites/:id/cancelar', AdminFamiliaController.cancelarConvite);

router.get('/api/admin/taxa-cdi', AdminTaxaCdiController.get);
router.put('/api/admin/taxa-cdi', AdminTaxaCdiController.atualizar);

module.exports = router;
