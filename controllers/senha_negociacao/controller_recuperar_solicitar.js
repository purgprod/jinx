const crypto                  = require('crypto');
const bcrypt                  = require('bcrypt');
const { validationResult }    = require('express-validator');
const pinBuscarModel          = require('../../models/senha_negociacao/model_pin_buscar');
const recuperacaoCriarModel   = require('../../models/senha_negociacao/model_recuperacao_criar');
const { enviarEmail }         = require('../../mailer');
const { gerarTemplateRecuperacaoPin } = require('../../templates/template_recuperacao_pin_negociacao');
const logger                  = require('../../logger');

// Reutiliza a busca de senha de login do model existente
const pool = require('../../database/database_purg');

async function buscarSenhaLogin(usuarioId) {
    const [rows] = await pool.promise().execute(
        'SELECT email, password FROM users WHERE usuario_id = ?',
        [usuarioId]
    );
    return rows.length ? rows[0] : null;
}

async function recuperarSolicitar(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = parseInt(req.params.id, 10);
    const { senha_login } = req.body;

    if (req.session.user.id !== usuarioId) {
        logger.warn(`Acesso negado à recuperação de PIN. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    try {
        const usuario = await buscarSenhaLogin(usuarioId);
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        const dados = await pinBuscarModel.buscarPinPorId(usuarioId);
        if (!dados?.senha_negociacao) {
            return res.status(404).json({ success: false, message: 'Nenhuma Senha de Negociação cadastrada para recuperar.' });
        }

        const senhaLoginCorreta = await bcrypt.compare(senha_login, usuario.password);
        if (!senhaLoginCorreta) {
            logger.warn(`Senha de login incorreta na recuperação de PIN para o usuário ID: ${usuarioId}`);
            return res.status(401).json({ success: false, message: 'Senha de acesso incorreta.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        await recuperacaoCriarModel.criarTokenRecuperacao(usuarioId, token);

        const html = gerarTemplateRecuperacaoPin(token);
        const enviado = await enviarEmail(usuario.email, 'Recuperação de Senha de Negociação - Purg', html);

        if (!enviado) {
            logger.error(`Falha ao enviar e-mail de recuperação de PIN para o usuário ID: ${usuarioId}`);
            return res.status(500).json({ success: false, message: 'Erro ao enviar e-mail. Tente novamente.' });
        }

        logger.info(`E-mail de recuperação de PIN enviado para o usuário ID: ${usuarioId}`);
        return res.status(200).json({ success: true, message: 'Instruções de recuperação enviadas para o seu e-mail.' });
    } catch (error) {
        logger.error(`Erro ao solicitar recuperação de PIN para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { recuperarSolicitar };
