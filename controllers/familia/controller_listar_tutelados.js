const RelacionamentosModel = require('../../models/familia/model_relacionamentos');
const logger               = require('../../logger');

async function listarTutelados(req, res) {
    const guardiaoId = req.session.user.id;

    try {
        const tutelados = await RelacionamentosModel.listarTuteladosPorGuardiao(guardiaoId);
        return res.status(200).json({ success: true, tutelados });
    } catch (err) {
        logger.error(`Erro ao listar tutelados do guardião ${guardiaoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { listarTutelados };
