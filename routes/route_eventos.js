const express      = require('express');
const router       = express.Router();
const { param }    = require('express-validator');
const authMiddleware = require('../middleware/auth');

const EventosPendentesController = require('../controllers/eventos/controller_eventos_pendentes');
const MarcarVistoController      = require('../controllers/eventos/controller_marcar_visto');

router.use('/api/v1/eventos/*', authMiddleware.checkAuthenticated);

// GET /api/v1/eventos/pendentes — retorna eventos pendentes do usuário logado
router.get('/api/v1/eventos/pendentes', EventosPendentesController.buscarEventosPendentes);

// POST /api/v1/eventos/:id/marcar-visto — marca evento informativo como visto
router.post(
    '/api/v1/eventos/:id/marcar-visto',
    [param('id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    MarcarVistoController.marcarVisto
);

module.exports = router;
