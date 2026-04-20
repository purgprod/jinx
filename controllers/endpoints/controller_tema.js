// controllers/endpoints/controller_tema.js

const { validationResult } = require('express-validator');
const TemaModel = require('../../models/endpoints/model_tema');
const logger    = require('../../logger');

class TemaController {

    // GET /api/v1/tema/:id
    static async getTema(req, res) {
        const usuarioId = parseInt(req.params.id, 10);
        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        try {
            const tema = await TemaModel.getTema(usuarioId);
            if (tema === null) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            return res.status(200).json({ tema });
        } catch (err) {
            logger.error(`[Tema] Erro ao consultar tema do usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao consultar preferência de tema.' });
        }
    }

    // PUT /api/v1/tema/:id
    static async setTema(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const usuarioId = parseInt(req.params.id, 10);
        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const { tema }  = req.body;

        try {
            const atualizado = await TemaModel.setTema(usuarioId, tema);
            if (!atualizado) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            return res.status(200).json({ message: 'Preferência de tema atualizada com sucesso.', tema });
        } catch (err) {
            logger.error(`[Tema] Erro ao atualizar tema do usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao atualizar preferência de tema.' });
        }
    }

}

module.exports = TemaController;
