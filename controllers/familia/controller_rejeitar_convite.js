// Tutelado rejeita o convite enviado por um guardião.

const { validationResult }     = require('express-validator');
const ConvitesModel            = require('../../models/familia/model_convites');
const EventosModel             = require('../../models/eventos/model_eventos');
const EventosUsuariosModel     = require('../../models/eventos/model_eventos_usuarios');
const { withTransaction }      = require('../../database/transaction');
const logger                   = require('../../logger');

async function rejeitarConvite(req, res) {
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

        if (convite.email_convidado.toLowerCase() !== tuteladoEmail.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Este convite não pertence à sua conta.' });
        }

        const evento = await EventosModel.buscarPorTokenNoPayload(token, tuteladoId);

        await withTransaction(async (conn) => {
            await ConvitesModel.marcarRecusado(token, conn);
            if (evento) {
                await EventosUsuariosModel.marcarInteragido({ evento_id: evento.id, usuario_id: tuteladoId }, conn);
            }
        });

        logger.info(`Convite recusado: tutelado ${tuteladoId} recusou convite do guardião ${convite.guardiao_id}`);
        return res.status(200).json({ success: true, message: 'Convite recusado.' });

    } catch (err) {
        logger.error(`Erro ao rejeitar convite familiar: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { rejeitarConvite };
