const RelacionamentosModel = require('../../models/familia/model_relacionamentos');
const logger               = require('../../logger');

async function listarGuardioes(req, res) {
    const tuteladoId = req.session.user.id;

    try {
        const guardioes = await RelacionamentosModel.listarGuardioesPorTutelado(tuteladoId);
        return res.status(200).json({ success: true, guardioes });
    } catch (err) {
        logger.error(`Erro ao listar guardiões do tutelado ${tuteladoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { listarGuardioes };
