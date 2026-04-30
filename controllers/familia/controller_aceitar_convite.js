const crypto               = require('crypto');
const { validationResult } = require('express-validator');
const ConvitesModel        = require('../../models/familia/model_convites');
const RelacionamentosModel = require('../../models/familia/model_relacionamentos');
const PermissoesModel      = require('../../models/familia/model_permissoes');
const { withTransaction }  = require('../../database/transaction');
const pool                 = require('../../database/database_purg');
const logger               = require('../../logger');

async function buscarUsuarioPorEmail(email) {
    const [rows] = await pool.promise().execute(
        `SELECT usuario_id, apelido, email FROM users WHERE email = ? LIMIT 1`,
        [email]
    );
    return rows[0] || null;
}

async function aceitarConvite(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const tuteladoId    = req.session.user.id;
    const tuteladoEmail = req.session.user.email;
    const { token }     = req.body;

    try {
        const convite = await ConvitesModel.buscarPorToken(token);

        if (!convite) {
            return res.status(404).json({ success: false, message: 'Convite não encontrado.' });
        }

        if (convite.status !== 'pendente') {
            return res.status(409).json({ success: false, message: 'Este convite já foi utilizado ou expirou.' });
        }

        if (new Date(convite.expira_em) < new Date()) {
            return res.status(410).json({ success: false, message: 'Este convite expirou.' });
        }

        if (convite.email_convidado.toLowerCase() !== tuteladoEmail.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Este convite não pertence à sua conta.' });
        }

        if (convite.guardiao_id === tuteladoId) {
            return res.status(400).json({ success: false, message: 'Você não pode aceitar um convite enviado por você mesmo.' });
        }

        const totalGuardioes = await RelacionamentosModel.contarGuardioesPorTutelado(tuteladoId);
        if (totalGuardioes >= 2) {
            return res.status(409).json({
                success: false,
                message: 'Você já possui 2 responsáveis vinculados. Remova um antes de aceitar um novo convite.'
            });
        }

        const jaVinculado = await RelacionamentosModel.buscarPorPar(convite.guardiao_id, tuteladoId);
        if (jaVinculado) {
            return res.status(409).json({ success: false, message: 'Este responsável já está vinculado à sua conta.' });
        }

        const vinculoCircular = await RelacionamentosModel.buscarPorPar(tuteladoId, convite.guardiao_id);
        if (vinculoCircular) {
            return res.status(400).json({ success: false, message: 'Vínculo circular não permitido.' });
        }

        const tokenAcesso     = crypto.randomBytes(32).toString('hex');
        const tokenAcessoHash = crypto.createHash('sha256').update(tokenAcesso).digest('hex');

        await withTransaction(async (conn) => {
            await RelacionamentosModel.criar({
                guardiao_id:       convite.guardiao_id,
                tutelado_id:       tuteladoId,
                token_acesso_hash: tokenAcessoHash,
            }, conn);

            await PermissoesModel.criar(tuteladoId, conn);
            await ConvitesModel.marcarAceito(token, conn);
        });

        logger.info(`Convite aceito: guardião ${convite.guardiao_id} → tutelado ${tuteladoId}`);
        return res.status(200).json({ success: true, message: 'Convite aceito. Vínculo familiar ativado.' });

    } catch (err) {
        logger.error(`Erro ao aceitar convite familiar: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { aceitarConvite };
