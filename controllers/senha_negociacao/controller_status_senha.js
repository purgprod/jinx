const senhaBuscarModel = require('../../models/senha_negociacao/model_senha_buscar');
const logger           = require('../../logger');

async function statusSenha(req, res) {
    const usuarioId = parseInt(req.params.id, 10);

    if (req.session.user.id !== usuarioId) {
        logger.warn(`Acesso negado ao status da Senha de Negociação. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    try {
        const dados = await senhaBuscarModel.buscarSenhaPorId(usuarioId);
        if (!dados) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        return res.status(200).json({
            success: true,
            senha_cadastrada: !!dados.senha_negociacao,
        });
    } catch (error) {
        logger.error(`Erro ao verificar status da Senha de Negociação para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { statusSenha };
