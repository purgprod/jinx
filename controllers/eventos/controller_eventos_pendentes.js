const EventosModel = require('../../models/eventos/model_eventos');
const logger       = require('../../logger');

async function buscarEventosPendentes(req, res) {
    const usuarioId = req.session.user.id;

    try {
        const eventos = await EventosModel.buscarPendentesParaUsuario(usuarioId);
        return res.status(200).json({ success: true, eventos });
    } catch (err) {
        logger.error(`Erro ao buscar eventos pendentes para usuário ${usuarioId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { buscarEventosPendentes };
