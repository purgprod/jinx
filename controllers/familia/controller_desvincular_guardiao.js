// controllers/familia/controller_desvincular_guardiao.js
// Permite que o tutelado (dependente) desvincule um guardião da própria conta.

const { validationResult } = require('express-validator');
const RelacionamentosModel = require('../../models/familia/model_relacionamentos');
const PermissoesModel      = require('../../models/familia/model_permissoes');
const logger               = require('../../logger');

async function desvincularGuardiao(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const tuteladoId = req.session.user.id;
    const guardiaoId = parseInt(req.params.guardiao_id, 10);

    try {
        const vinculo = await RelacionamentosModel.buscarPorPar(guardiaoId, tuteladoId);
        if (!vinculo) {
            return res.status(403).json({ success: false, message: 'Vínculo não encontrado ou não pertence a você.' });
        }

        await RelacionamentosModel.revogar(guardiaoId, tuteladoId);

        // Se não houver mais guardiões, remove as permissões do tutelado
        const guardiaoesRestantes = await RelacionamentosModel.contarGuardioesPorTutelado(tuteladoId);
        if (guardiaoesRestantes === 0) {
            await PermissoesModel.excluir(tuteladoId);
        }

        logger.info(`Tutelado ${tuteladoId} desvinculou guardião ${guardiaoId}`);
        return res.status(200).json({ success: true, message: 'Guardião desvinculado com sucesso.' });

    } catch (err) {
        logger.error(`Erro ao desvincular guardião ${guardiaoId} do tutelado ${tuteladoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { desvincularGuardiao };
