// controllers/familia/controller_convidar_guardiao.js
// Tutelado envia convite por e-mail para um potencial guardião.

const crypto                           = require('crypto');
const { validationResult }             = require('express-validator');
const ConvitesGuardiaoModel            = require('../../models/familia/model_convites_guardiao');
const RelacionamentosModel             = require('../../models/familia/model_relacionamentos');
const { enviarEmail }                  = require('../../mailer');
const { gerarTemplateConviteGuardiao } = require('../../templates/template_convite_guardiao');
const logger                           = require('../../logger');
const pool                             = require('../../database/database_purg');

const EXPIRACAO_DIAS = 7;

async function buscarGuardiaoPorEmail(email) {
    const [rows] = await pool.promise().execute(
        `SELECT usuario_id, apelido, email, adulto FROM users
         WHERE email = ? AND status_ativo = 1 LIMIT 1`,
        [email]
    );
    return rows[0] || null;
}

async function convidarGuardiao(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const tuteladoId   = req.session.user.id;
    const nomeTutelado = req.session.user.nome_completo || req.session.user.nome;
    const { email }    = req.body;

    if (email.toLowerCase() === req.session.user.email.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Você não pode convidar a si mesmo.' });
    }

    try {
        // Tutelado não pode ter mais de 2 guardiões
        const totalGuardioes = await RelacionamentosModel.contarGuardioesPorTutelado(tuteladoId);
        if (totalGuardioes >= 2) {
            return res.status(409).json({
                success: false,
                message: 'Você já possui 2 responsáveis. Remova um antes de convidar outro.'
            });
        }

        const guardiao = await buscarGuardiaoPorEmail(email);

        if (guardiao) {
            // Potencial guardião deve ser maior de idade
            if (!guardiao.adulto) {
                return res.status(409).json({
                    success: false,
                    message: 'Este usuário não pode ser responsável pois é menor de idade.'
                });
            }

            // Potencial guardião não pode já ter 2 dependentes
            const totalTutelados = await RelacionamentosModel.contarTuteladosPorGuardiao(guardiao.usuario_id);
            if (totalTutelados >= 2) {
                return res.status(409).json({
                    success: false,
                    message: 'Este usuário já possui 2 dependentes e não pode aceitar novos vínculos.'
                });
            }

            // Já vinculado
            const jaVinculado = await RelacionamentosModel.buscarPorPar(guardiao.usuario_id, tuteladoId);
            if (jaVinculado) {
                return res.status(409).json({ success: false, message: 'Este usuário já é seu responsável.' });
            }

            // Vínculo circular
            const vinculoCircular = await RelacionamentosModel.buscarPorPar(tuteladoId, guardiao.usuario_id);
            if (vinculoCircular) {
                return res.status(400).json({ success: false, message: 'Vínculo circular não permitido.' });
            }
        }

        // Convite duplicado
        const convitePendente = await ConvitesGuardiaoModel.buscarPendentePorTuteladoEEmail(tuteladoId, email);
        if (convitePendente) {
            return res.status(409).json({ success: false, message: 'Já existe um convite pendente para este e-mail.' });
        }

        const token    = crypto.randomBytes(32).toString('hex');
        const expiraEm = new Date(Date.now() + EXPIRACAO_DIAS * 24 * 60 * 60 * 1000);

        await ConvitesGuardiaoModel.criar({
            tutelado_id:     tuteladoId,
            email_convidado: email,
            token_convite:   token,
            expira_em:       expiraEm,
        });

        const linkLogin    = `https://purg.com.br/login?convite_guardiao=${token}`;
        const linkCadastro = `https://purg.com.br/cadastro?convite_guardiao=${token}`;

        const html    = gerarTemplateConviteGuardiao({ nomeTutelado, linkLogin, linkCadastro });
        const enviado = await enviarEmail(email, 'Convite Modo Família - Purg', html);

        if (!enviado) {
            logger.error(`Falha ao enviar convite de guardião para ${email}`);
            return res.status(500).json({ success: false, message: 'Erro ao enviar e-mail de convite. Tente novamente.' });
        }

        logger.info(`Convite de guardião enviado pelo tutelado ${tuteladoId} para ${email}`);
        return res.status(200).json({ success: true, message: 'Convite enviado com sucesso.' });

    } catch (err) {
        logger.error(`Erro ao enviar convite de guardião: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { convidarGuardiao };
