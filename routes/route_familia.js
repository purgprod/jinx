const express              = require('express');
const router               = express.Router();
const { body, param }      = require('express-validator');
const authMiddleware       = require('../middleware/auth');

const ConvidarController            = require('../controllers/familia/controller_convidar');
const AceitarConviteController      = require('../controllers/familia/controller_aceitar_convite');
const ListarTuteladosController     = require('../controllers/familia/controller_listar_tutelados');
const TrocarPerfilController        = require('../controllers/familia/controller_trocar_perfil');
const RetornarPerfilController      = require('../controllers/familia/controller_retornar_perfil');
const PermissoesBuscarController    = require('../controllers/familia/controller_permissoes_buscar');
const PermissoesAtualizarController = require('../controllers/familia/controller_permissoes_atualizar');
const RevogarController             = require('../controllers/familia/controller_revogar');
const ConvitesPendentesController   = require('../controllers/familia/controller_convites_pendentes');
const ListarGuardioesController     = require('../controllers/familia/controller_listar_guardioes');
const DesvincularGuardiaoController        = require('../controllers/familia/controller_desvincular_guardiao');
const ListarGuardioesElegiveisController   = require('../controllers/familia/controller_listar_guardioes_elegiveis');
const ConvidarGuardiaoController           = require('../controllers/familia/controller_convidar_guardiao');
const AceitarConviteGuardiaoController     = require('../controllers/familia/controller_aceitar_convite_guardiao');

// Todas as rotas de família requerem autenticação
router.use('/api/v1/familia/*', authMiddleware.checkAuthenticated);

// GET /api/v1/familia/tutelados — lista os tutelados vinculados ao guardião logado
router.get('/api/v1/familia/tutelados', ListarTuteladosController.listarTutelados);

// GET /api/v1/familia/convites-pendentes — lista convites enviados pelo guardião ainda não aceitos
router.get('/api/v1/familia/convites-pendentes', ConvitesPendentesController.listarConvitesPendentes);

// GET /api/v1/familia/guardioes — lista os guardiões vinculados ao tutelado logado
router.get('/api/v1/familia/guardioes', ListarGuardioesController.listarGuardioes);

// GET /api/v1/familia/guardioes-elegiveis — lista usuários que podem ser guardião do tutelado logado
router.get('/api/v1/familia/guardioes-elegiveis', ListarGuardioesElegiveisController.listarGuardioesElegiveis);

// POST /api/v1/familia/convidar — guardião envia convite por e-mail
router.post(
    '/api/v1/familia/convidar',
    [
        body('email')
            .notEmpty().withMessage('O e-mail é obrigatório.')
            .isEmail().withMessage('Informe um e-mail válido.')
            .normalizeEmail({ gmail_remove_dots: false }),
    ],
    ConvidarController.convidar
);

// POST /api/v1/familia/aceitar-convite — tutelado aceita o convite via token do e-mail
router.post(
    '/api/v1/familia/aceitar-convite',
    [
        body('token')
            .notEmpty().withMessage('Token é obrigatório.')
            .isHexadecimal().withMessage('Token inválido.')
            .isLength({ min: 64, max: 64 }).withMessage('Token inválido.'),
    ],
    AceitarConviteController.aceitarConvite
);

// POST /api/v1/familia/trocar-perfil/:tutelado_id — guardião entra na conta do tutelado
router.post(
    '/api/v1/familia/trocar-perfil/:tutelado_id',
    [param('tutelado_id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    TrocarPerfilController.trocarPerfil
);

// POST /api/v1/familia/retornar-perfil — guardião retorna ao próprio perfil
router.post('/api/v1/familia/retornar-perfil', RetornarPerfilController.retornarPerfil);

// GET /api/v1/familia/permissoes/:tutelado_id — guardião consulta as permissões do tutelado
router.get(
    '/api/v1/familia/permissoes/:tutelado_id',
    [param('tutelado_id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    PermissoesBuscarController.buscarPermissoes
);

// PUT /api/v1/familia/permissoes/:tutelado_id — guardião atualiza as permissões do tutelado
router.put(
    '/api/v1/familia/permissoes/:tutelado_id',
    [
        param('tutelado_id').isInt({ gt: 0 }).withMessage('ID inválido.'),
        body('pode_sacar').optional().isBoolean().withMessage('pode_sacar deve ser booleano.'),
        body('pode_depositar').optional().isBoolean().withMessage('pode_depositar deve ser booleano.'),
        body('pode_criar_objetivos').optional().isBoolean().withMessage('pode_criar_objetivos deve ser booleano.'),
        body('pode_alterar_perfil').optional().isBoolean().withMessage('pode_alterar_perfil deve ser booleano.'),
        body('pode_alterar_pix').optional().isBoolean().withMessage('pode_alterar_pix deve ser booleano.'),
        body('chaves_pix_autorizadas').optional().isArray().withMessage('chaves_pix_autorizadas deve ser um array.'),
    ],
    PermissoesAtualizarController.atualizarPermissoes
);

// DELETE /api/v1/familia/revogar/:tutelado_id — guardião remove o vínculo com o tutelado
router.delete(
    '/api/v1/familia/revogar/:tutelado_id',
    [param('tutelado_id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    RevogarController.revogar
);

// POST /api/v1/familia/convidar-guardiao — tutelado envia convite por e-mail para um potencial guardião
router.post(
    '/api/v1/familia/convidar-guardiao',
    [
        body('email')
            .notEmpty().withMessage('O e-mail é obrigatório.')
            .isEmail().withMessage('Informe um e-mail válido.')
            .normalizeEmail({ gmail_remove_dots: false }),
    ],
    ConvidarGuardiaoController.convidarGuardiao
);

// POST /api/v1/familia/aceitar-convite-guardiao — guardião aceita o convite enviado pelo tutelado
router.post(
    '/api/v1/familia/aceitar-convite-guardiao',
    [
        body('token')
            .notEmpty().withMessage('Token é obrigatório.')
            .isHexadecimal().withMessage('Token inválido.')
            .isLength({ min: 64, max: 64 }).withMessage('Token inválido.'),
    ],
    AceitarConviteGuardiaoController.aceitarConviteGuardiao
);

// DELETE /api/v1/familia/desvincular-guardiao/:guardiao_id — tutelado remove um guardião da própria conta
router.delete(
    '/api/v1/familia/desvincular-guardiao/:guardiao_id',
    [param('guardiao_id').isInt({ gt: 0 }).withMessage('ID inválido.')],
    DesvincularGuardiaoController.desvincularGuardiao
);

module.exports = router;
