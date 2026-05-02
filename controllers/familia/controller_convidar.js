const crypto                      = require('crypto');
const { validationResult }        = require('express-validator');
const ConvitesModel               = require('../../models/familia/model_convites');
const RelacionamentosModel        = require('../../models/familia/model_relacionamentos');
const { enviarEmail }             = require('../../mailer');
const { gerarTemplateConviteFamilia } = require('../../templates/template_convite_familia');
const logger                      = require('../../logger');
const pool                        = require('../../database/database_purg');

const EXPIRACAO_DIAS = 7;

async function buscarUsuarioPorEmail(email) {
    const [rows] = await pool.promise().execute(
        `SELECT usuario_id, apelido, email FROM users WHERE email = ? LIMIT 1`,
        [email]
    );
    return rows[0] || null;
}

async function convidar(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const guardiaoId   = req.session.user.id;
    const nomeGuardiao = req.session.user.nome_completo;
    const { email }    = req.body;

    if (email.toLowerCase() === req.session.user.email.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Você não pode convidar a si mesmo.' });
    }

    try {
        const tutelado = await buscarUsuarioPorEmail(email);

        if (tutelado) {
            const totalGuardioes = await RelacionamentosModel.contarGuardioesPorTutelado(tutelado.usuario_id);
            if (totalGuardioes >= 2) {
                return res.status(409).json({
                    success: false,
                    message: 'Este usuário já possui 2 responsáveis e não aceita novos vínculos.'
                });
            }

            const jaVinculado = await RelacionamentosModel.buscarPorPar(guardiaoId, tutelado.usuario_id);
            if (jaVinculado) {
                return res.status(409).json({ success: false, message: 'Este e-mail já está vinculado como dependente.' });
            }

            const vinculoCircular = await RelacionamentosModel.buscarPorPar(tutelado.usuario_id, guardiaoId);
            if (vinculoCircular) {
                return res.status(400).json({ success: false, message: 'Este usuário já é seu responsável.' });
            }
        }

        const convitePendente = await ConvitesModel.buscarPendentesPorGuardiaoEEmail(guardiaoId, email);
        if (convitePendente) {
            return res.status(409).json({ success: false, message: 'Já existe um convite pendente para este e-mail.' });
        }

        const token    = crypto.randomBytes(32).toString('hex');
        const expiraEm = new Date(Date.now() + EXPIRACAO_DIAS * 24 * 60 * 60 * 1000);

        await ConvitesModel.criar({
            guardiao_id:     guardiaoId,
            email_convidado: email,
            token_convite:   token,
            expira_em:       expiraEm,
        });

        const temConta     = !!tutelado;
        const linkAceitar  = `https://purg.com.br/familia/aceitar-convite?token=${token}`;
        const linkCadastro = `https://purg.com.br/cadastro?convite=${token}`;

        const html = gerarTemplateConviteFamilia({ nomeGuardiao, linkAceitar, linkCadastro, temConta });
        const enviado = await enviarEmail(email, 'Convite Modo Família - Purg', html);

        if (!enviado) {
            logger.error(`Falha ao enviar convite familiar para ${email}`);
            return res.status(500).json({ success: false, message: 'Erro ao enviar e-mail de convite. Tente novamente.' });
        }

        logger.info(`Convite familiar enviado por guardião ${guardiaoId} para ${email}`);
        return res.status(200).json({ success: true, message: 'Convite enviado com sucesso.' });

    } catch (err) {
        logger.error(`Erro ao enviar convite familiar: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { convidar };
