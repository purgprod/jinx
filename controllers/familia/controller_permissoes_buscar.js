const { validationResult }  = require('express-validator');
const RelacionamentosModel  = require('../../models/familia/model_relacionamentos');
const PermissoesModel       = require('../../models/familia/model_permissoes');
const logger                = require('../../logger');

async function buscarPermissoes(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const guardiaoId = req.session.user.id;
    const tuteladoId = parseInt(req.params.tutelado_id, 10);

    try {
        const vinculo = await RelacionamentosModel.buscarPorPar(guardiaoId, tuteladoId);
        if (!vinculo) {
            return res.status(403).json({ success: false, message: 'Você não possui vínculo ativo com este usuário.' });
        }

        const permissoes = await PermissoesModel.buscarPorTutelado(tuteladoId);
        if (!permissoes) {
            return res.status(404).json({ success: false, message: 'Permissões não encontradas.' });
        }

        return res.status(200).json({ success: true, permissoes });

    } catch (err) {
        logger.error(`Erro ao buscar permissões do tutelado ${tuteladoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { buscarPermissoes };
