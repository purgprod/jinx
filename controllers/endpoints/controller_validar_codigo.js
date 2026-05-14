const bcrypt = require('bcrypt');
const { findUserByEmail } = require('../../models/endpoints/model_autenticacao_purg');
const logger = require('../../logger');

exports.validarCodigo = async (req, res) => {
    const { email, codigo } = req.body;

    try {
        const usuario = await findUserByEmail(email);

        if (!usuario) {
            logger.warn(`Validação de código: e-mail não encontrado: ${email}`);
            return res.status(401).json({ success: false, message: 'Código inválido.' });
        }

        const valido = await bcrypt.compare(String(codigo), usuario.password);

        if (!valido) {
            logger.warn(`Validação de código: código incorreto para o usuário ID: ${usuario.usuario_id}`);
            return res.status(401).json({ success: false, message: 'Código inválido.' });
        }

        logger.info(`Validação de código bem-sucedida para o usuário ID: ${usuario.usuario_id}`);
        return res.status(200).json({ success: true, message: 'Código validado com sucesso.' });

    } catch (error) {
        logger.error(`Erro ao validar código: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro ao processar a solicitação.' });
    }
};
