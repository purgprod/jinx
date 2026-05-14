const bcrypt = require('bcrypt');
const { findUserByEmail } = require('../../models/endpoints/model_autenticacao_purg');
const { atualizarSenha } = require('../../models/endpoints/model_troca_senha');
const logger = require('../../logger');

exports.novaSenha = async (req, res) => {
    const { email, codigo, nova_senha } = req.body;

    try {
        const usuario = await findUserByEmail(email);

        if (!usuario) {
            logger.warn(`Nova senha: e-mail não encontrado: ${email}`);
            return res.status(401).json({ success: false, message: 'Código inválido.' });
        }

        const codigoValido = await bcrypt.compare(String(codigo), usuario.password);

        if (!codigoValido) {
            logger.warn(`Nova senha: código incorreto para o usuário ID: ${usuario.usuario_id}`);
            return res.status(401).json({ success: false, message: 'Código inválido.' });
        }

        await atualizarSenha(usuario.usuario_id, nova_senha);

        logger.info(`Nova senha definida com sucesso para o usuário ID: ${usuario.usuario_id}`);
        return res.status(200).json({ success: true, message: 'Senha alterada com sucesso.' });

    } catch (error) {
        logger.error(`Erro ao definir nova senha: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro ao processar a solicitação.' });
    }
};
