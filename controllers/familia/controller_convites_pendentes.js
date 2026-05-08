const ConvitesModel        = require('../../models/familia/model_convites');
const ConvitesGuardiaoModel = require('../../models/familia/model_convites_guardiao');
const logger               = require('../../logger');

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

async function listarConvitesGuardiaoPendentes(req, res) {
    const tuteladoId = req.session.user.id;

    try {
        const convites = await ConvitesGuardiaoModel.listarPendentesPorTutelado(tuteladoId);
        return res.status(200).json({ success: true, convites });
    } catch (err) {
        logger.error(`Erro ao listar convites de guardião pendentes do tutelado ${tuteladoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { listarConvitesPendentes, listarConvitesGuardiaoPendentes };
