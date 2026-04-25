const pinBuscarModel = require('../../models/senha_negociacao/model_pin_buscar');
const logger         = require('../../logger');

async function statusPin(req, res) {
    const usuarioId = parseInt(req.params.id, 10);

    if (req.session.user.id !== usuarioId) {
        logger.warn(`Acesso negado ao status do PIN. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    try {
        const dados = await pinBuscarModel.buscarPinPorId(usuarioId);
        if (!dados) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        return res.status(200).json({
            success: true,
            pin_cadastrado: !!dados.senha_negociacao,
        });
    } catch (error) {
        logger.error(`Erro ao verificar status do PIN para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { statusPin };
