const { validationResult } = require('express-validator');
const PermissoesModel      = require('../../models/familia/model_permissoes');
const logger               = require('../../logger');

const PERMISSOES_PADRAO = {
    pode_sacar:          true,
    pode_depositar:      true,
    pode_alterar_perfil: true,
    pode_alterar_pix:    true,
    chaves_pix_autorizadas: [],
};

async function buscarPermissoesProprias(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId        = req.session.user.id;
    const userIdParam   = parseInt(req.params.userId, 10);

    if (userId !== userIdParam) {
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    try {
        const permissoes = await PermissoesModel.buscarPorTutelado(userId);

        if (!permissoes) {
            return res.status(200).json({ success: true, permissoes: PERMISSOES_PADRAO });
        }

        return res.status(200).json({ success: true, permissoes });

    } catch (err) {
        logger.error(`Erro ao buscar permissões próprias do usuário ${userId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { buscarPermissoesProprias };
