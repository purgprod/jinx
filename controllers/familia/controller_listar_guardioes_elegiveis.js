// controllers/familia/controller_listar_guardioes_elegiveis.js
// Retorna usuários elegíveis para ser guardião do tutelado logado:
// maiores de 18 anos, com menos de 2 dependentes ativos e ainda não vinculados a este tutelado.

const RelacionamentosModel = require('../../models/familia/model_relacionamentos');
const logger               = require('../../logger');

async function listarGuardioesElegiveis(req, res) {
    const tuteladoId = req.session.user.id;

    try {
        const usuarios = await RelacionamentosModel.listarGuardioesElegiveis(tuteladoId);
        return res.status(200).json(usuarios);
    } catch (err) {
        logger.error(`Erro ao listar guardiões elegíveis para tutelado ${tuteladoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { listarGuardioesElegiveis };
