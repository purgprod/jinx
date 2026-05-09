const { param, validationResult } = require('express-validator');
const RankingDadosModel           = require('../../models/ranking/model_ranking_dados');
const logger                      = require('../../logger');

const RankingDadosController = {
    async getDadosUsuario(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const usuarioId = parseInt(req.params.usuario_id, 10);

        try {
            const dados = await RankingDadosModel.getByUsuarioId(usuarioId);

            if (!dados) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado no ranking.' });
            }

            return res.status(200).json({ success: true, dados });
        } catch (err) {
            logger.error(`Erro ao buscar ranking_dados do usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ success: false, message: 'Erro no servidor.' });
        }
    },
};

module.exports = RankingDadosController;
