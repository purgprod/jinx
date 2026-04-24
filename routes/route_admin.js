const express = require('express');
const router = express.Router();
const AdminDebugController = require('../controllers/admin/controller_admin_debug');

router.get('/api/admin/debug/status', AdminDebugController.getStatus);
router.post('/api/admin/debug/toggle', AdminDebugController.toggle);

module.exports = router;
