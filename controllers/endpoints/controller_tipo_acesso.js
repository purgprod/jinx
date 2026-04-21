// controllers/endpoints/controller_tipo_acesso.js

const { validationResult } = require('express-validator');
const tipoAcessoModel = require('../../models/endpoints/model_tipo_acesso');
const logger = require('../../logger');

async function getTipoAcesso(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const email = req.body.email.trim().toLowerCase();

    try {
        const preferencia = await tipoAcessoModel.buscarPreferenciaLoginPorEmail(email);

        if (preferencia === undefined) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        return res.status(200).json({ tipo: preferencia });

    } catch (error) {
        logger.error(`[TipoAcesso] Erro ao verificar tipo de acesso para ${email}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

async function setPreferenciaLogin(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = parseInt(req.params.id, 10);

    if (req.session.user.id !== usuarioId) {
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    const { preferencia_login } = req.body;

    try {
        const atualizado = await tipoAcessoModel.atualizarPreferenciaLogin(usuarioId, preferencia_login);
        if (!atualizado) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        logger.info(`[TipoAcesso] Preferência de login do usuário ${usuarioId} atualizada para "${preferencia_login}"`);
        return res.status(200).json({ success: true, preferencia_login });

    } catch (error) {
        logger.error(`[TipoAcesso] Erro ao atualizar preferência de login do usuário ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { getTipoAcesso, setPreferenciaLogin };
