const { validationResult } = require('express-validator');
const RelacionamentosModel = require('../../models/familia/model_relacionamentos');
const PermissoesModel      = require('../../models/familia/model_permissoes');
const logger               = require('../../logger');

const CAMPOS_BOOLEANOS = [
    'pode_sacar', 'pode_depositar',
    'pode_alterar_perfil', 'pode_alterar_pix',
];

const CHAVES_PIX_VALIDAS = ['pix_cpf', 'pix_celular', 'pix_email', 'pix_chave'];

async function atualizarPermissoes(req, res) {
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

        const campos = {};

        for (const campo of CAMPOS_BOOLEANOS) {
            if (req.body[campo] !== undefined) {
                campos[campo] = req.body[campo] ? 1 : 0;
            }
        }

        if (req.body.chaves_pix_autorizadas !== undefined) {
            const chaves = req.body.chaves_pix_autorizadas;
            if (!Array.isArray(chaves)) {
                return res.status(400).json({ success: false, message: 'chaves_pix_autorizadas deve ser um array.' });
            }
            const invalidas = chaves.filter(c => !CHAVES_PIX_VALIDAS.includes(c));
            if (invalidas.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Chaves inválidas: ${invalidas.join(', ')}. Use: ${CHAVES_PIX_VALIDAS.join(', ')}.`
                });
            }
            campos.chaves_pix_autorizadas = chaves;
        }

        if (Object.keys(campos).length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo de permissão enviado para atualização.' });
        }

        await PermissoesModel.atualizar(tuteladoId, campos);

        logger.info(`Guardião ${guardiaoId} atualizou permissões do tutelado ${tuteladoId}`);
        return res.status(200).json({ success: true, message: 'Permissões atualizadas com sucesso.' });

    } catch (err) {
        logger.error(`Erro ao atualizar permissões do tutelado ${tuteladoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { atualizarPermissoes };
