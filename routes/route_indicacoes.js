// routes/route_indicacoes.js

const express                  = require('express');
const router                   = express.Router();
const { param }                = require('express-validator');
const authMiddleware           = require('../middleware/auth');
const IndicacoesController     = require('../controllers/indicacoes/controller_indicacoes');
const DadosIndicacaoController = require('../controllers/indicacoes/controller_dados_indicacao');

router.use('/api/v1/indicacoes/*', authMiddleware.checkAuthenticated);

// GET /api/v1/indicacoes/meu-codigo — retorna o código e link de indicação do usuário logado
router.get('/api/v1/indicacoes/meu-codigo', IndicacoesController.buscarMinhasIndicacoes);

// GET /api/v1/indicacoes/:usuario_id — retorna código, pontos e lista de indicados do usuário
router.get(
    '/api/v1/indicacoes/:usuario_id',
    [param('usuario_id').isInt({ gt: 0 }).withMessage('usuario_id inválido.')],
    DadosIndicacaoController.getDadosIndicacao
);

module.exports = router;
