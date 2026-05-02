const ConvitesModel = require('../../models/familia/model_convites');
const logger        = require('../../logger');

async function listarConvitesPendentes(req, res) {
    const guardiaoId = req.session.user.id;

    try {
        const convites = await ConvitesModel.listarPendentesPorGuardiao(guardiaoId);
        return res.status(200).json({ success: true, convites });
    } catch (err) {
        logger.error(`Erro ao listar convites pendentes do guardião ${guardiaoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { listarConvitesPendentes };
