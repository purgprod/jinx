// controllers/endpoints/controller_visualizacao_valores.js

const { validationResult }       = require('express-validator');
const VisualizacaoValoresModel   = require('../../models/endpoints/model_visualizacao_valores');
const logger                     = require('../../logger');

class VisualizacaoValoresController {

    // GET /api/v1/visualizacao-valores/:id
    static async get(req, res) {
        const usuarioId = parseInt(req.params.id, 10);
        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        try {
            const valor = await VisualizacaoValoresModel.get(usuarioId);
            if (valor === null) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            return res.status(200).json({ visualizacao_valores: valor });
        } catch (err) {
            logger.error(`[VisualizacaoValores] Erro ao consultar usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao consultar preferência de visualização.' });
        }
    }

    // PUT /api/v1/visualizacao-valores/:id
    static async set(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const usuarioId = parseInt(req.params.id, 10);
        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const valor = parseInt(req.body.visualizacao_valores, 10);

        try {
            const atualizado = await VisualizacaoValoresModel.set(usuarioId, valor);
            if (!atualizado) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            return res.status(200).json({ message: 'Preferência de visualização atualizada com sucesso.', visualizacao_valores: valor });
        } catch (err) {
            logger.error(`[VisualizacaoValores] Erro ao atualizar usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao atualizar preferência de visualização.' });
        }
    }

}

module.exports = VisualizacaoValoresController;
