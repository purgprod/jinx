// controllers/familia/controller_aceitar_convite_guardiao.js
// Guardião (potencial) aceita o convite enviado pelo tutelado.

const crypto                  = require('crypto');
const { validationResult }    = require('express-validator');
const ConvitesGuardiaoModel   = require('../../models/familia/model_convites_guardiao');
const RelacionamentosModel    = require('../../models/familia/model_relacionamentos');
const PermissoesModel         = require('../../models/familia/model_permissoes');
const EventosModel            = require('../../models/eventos/model_eventos');
const EventosUsuariosModel    = require('../../models/eventos/model_eventos_usuarios');
const { withTransaction }     = require('../../database/transaction');
const logger                  = require('../../logger');

async function aceitarConviteGuardiao(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const guardiaoId    = req.session.user.id;
    const guardiaoEmail = req.session.user.email;
    const { token }     = req.body;

    try {
        const convite = await ConvitesGuardiaoModel.buscarPorToken(token);

        if (!convite) {
            return res.status(404).json({ success: false, message: 'Convite não encontrado.' });
        }

        if (convite.status !== 'pendente') {
            return res.status(409).json({ success: false, message: 'Este convite já foi utilizado ou expirou.' });
        }

        if (new Date(convite.expira_em) < new Date()) {
            return res.status(410).json({ success: false, message: 'Este convite expirou.' });
        }

        if (convite.email_convidado.toLowerCase() !== guardiaoEmail.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Este convite não pertence à sua conta.' });
        }

        if (convite.tutelado_id === guardiaoId) {
            return res.status(400).json({ success: false, message: 'Você não pode aceitar um convite enviado por você mesmo.' });
        }

        const tuteladoId = convite.tutelado_id;

        // Guardião deve ser adulto
        const [rowsGuardiao] = await require('../../database/database_purg').promise().execute(
            'SELECT adulto FROM users WHERE usuario_id = ? LIMIT 1',
            [guardiaoId]
        );
        if (!rowsGuardiao[0]?.adulto) {
            return res.status(403).json({ success: false, message: 'Você precisa ser maior de idade para ser responsável.' });
        }

        // Guardião não pode já ter 2 dependentes
        const totalTutelados = await RelacionamentosModel.contarTuteladosPorGuardiao(guardiaoId);
        if (totalTutelados >= 2) {
            return res.status(409).json({
                success: false,
                message: 'Você já possui 2 dependentes e não pode aceitar novos vínculos.'
            });
        }

        // Tutelado não pode já ter 2 guardiões
        const totalGuardioes = await RelacionamentosModel.contarGuardioesPorTutelado(tuteladoId);
        if (totalGuardioes >= 2) {
            return res.status(409).json({
                success: false,
                message: 'O dependente já possui 2 responsáveis vinculados.'
            });
        }

        // Já vinculado
        const jaVinculado = await RelacionamentosModel.buscarPorPar(guardiaoId, tuteladoId);
        if (jaVinculado) {
            return res.status(409).json({ success: false, message: 'Você já é responsável deste dependente.' });
        }

        // Vínculo circular
        const vinculoCircular = await RelacionamentosModel.buscarPorPar(tuteladoId, guardiaoId);
        if (vinculoCircular) {
            return res.status(400).json({ success: false, message: 'Vínculo circular não permitido.' });
        }

        const tokenAcesso     = crypto.randomBytes(32).toString('hex');
        const tokenAcessoHash = crypto.createHash('sha256').update(tokenAcesso).digest('hex');

        const evento = await EventosModel.buscarPorTokenNoPayload(token, guardiaoId);

        await withTransaction(async (conn) => {
            await RelacionamentosModel.criar({
                guardiao_id:       guardiaoId,
                tutelado_id:       tuteladoId,
                token_acesso_hash: tokenAcessoHash,
            }, conn);

            await PermissoesModel.criar(tuteladoId, conn);
            await ConvitesGuardiaoModel.marcarAceito(token, conn);

            if (evento) {
                await EventosUsuariosModel.marcarInteragido({ evento_id: evento.id, usuario_id: guardiaoId }, conn);
            }
        });

        logger.info(`Convite de guardião aceito: guardião ${guardiaoId} → tutelado ${tuteladoId}`);
        return res.status(200).json({ success: true, message: 'Convite aceito. Vínculo familiar ativado.' });

    } catch (err) {
        logger.error(`Erro ao aceitar convite de guardião: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { aceitarConviteGuardiao };
