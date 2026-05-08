const { param, validationResult } = require('express-validator');
const EventosModel         = require('../../models/eventos/model_eventos');
const EventosUsuariosModel = require('../../models/eventos/model_eventos_usuarios');
const logger               = require('../../logger');

async function marcarVisto(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = req.session.user.id;
    const eventoId  = parseInt(req.params.id, 10);

    try {
        const evento = await EventosModel.buscarPorId(eventoId);

        if (!evento || !evento.ativo) {
            return res.status(404).json({ success: false, message: 'Evento não encontrado.' });
        }

        if (evento.tipo !== 'informativo') {
            return res.status(400).json({ success: false, message: 'Eventos interativos exigem uma ação específica.' });
        }

        if (evento.usuario_id !== null && evento.usuario_id !== usuarioId) {
            return res.status(403).json({ success: false, message: 'Este evento não pertence à sua conta.' });
        }

        await EventosUsuariosModel.marcarInteragido({ evento_id: eventoId, usuario_id: usuarioId });

        return res.status(200).json({ success: true, message: 'Evento marcado como visto.' });
    } catch (err) {
        logger.error(`Erro ao marcar evento ${eventoId} como visto para usuário ${usuarioId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { marcarVisto };
