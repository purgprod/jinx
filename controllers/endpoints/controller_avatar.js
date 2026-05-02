// controllers/endpoints/controller_avatar.js

const { validationResult } = require('express-validator');
const AvatarModel = require('../../models/endpoints/model_avatar');
const logger      = require('../../logger');

class AvatarController {

    // GET /api/v1/avatar/:id
    static async getAvatar(req, res) {
        const usuarioId = parseInt(req.params.id, 10);
        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        try {
            const avatarId = await AvatarModel.getAvatar(usuarioId);
            if (avatarId === null) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            return res.status(200).json({ avatar_id: avatarId });
        } catch (err) {
            logger.error(`[Avatar] Erro ao consultar avatar do usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao consultar avatar.' });
        }
    }

    // PUT /api/v1/avatar/:id
    static async setAvatar(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const usuarioId = parseInt(req.params.id, 10);
        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const avatarId = parseInt(req.body.avatar_id, 10);

        try {
            const atualizado = await AvatarModel.setAvatar(usuarioId, avatarId);
            if (!atualizado) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            return res.status(200).json({ message: 'Avatar atualizado com sucesso.', avatar_id: avatarId });
        } catch (err) {
            logger.error(`[Avatar] Erro ao atualizar avatar do usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao atualizar avatar.' });
        }
    }

}

module.exports = AvatarController;
