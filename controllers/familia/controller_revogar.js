const { validationResult }  = require('express-validator');
const RelacionamentosModel  = require('../../models/familia/model_relacionamentos');
const PermissoesModel       = require('../../models/familia/model_permissoes');
const logger                = require('../../logger');

async function revogar(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const guardiaoId = req.session.user.id;
    const tuteladoId = parseInt(req.params.tutelado_id, 10);

    try {
        const vinculo = await RelacionamentosModel.buscarPorPar(guardiaoId, tuteladoId);
        if (!vinculo) {
            return res.status(403).json({ success: false, message: 'Vínculo não encontrado ou não pertence a você.' });
        }

        await RelacionamentosModel.revogar(guardiaoId, tuteladoId);

        // Se o tutelado não tiver mais nenhum guardião, remove as permissões
        const guardiaoesRestantes = await RelacionamentosModel.contarGuardioesPorTutelado(tuteladoId);
        if (guardiaoesRestantes === 0) {
            await PermissoesModel.excluir(tuteladoId);
        }

        logger.info(`Guardião ${guardiaoId} revogou vínculo com tutelado ${tuteladoId}`);
        return res.status(200).json({ success: true, message: 'Vínculo revogado com sucesso.' });

    } catch (err) {
        logger.error(`Erro ao revogar vínculo familiar: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { revogar };
