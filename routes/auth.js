const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para login
router.post('/login', authController.login);

// Rota para registro
router.post('/register', authController.register);

// Rota para logout
router.post('/logout', authController.logout);

module.exports = router;
