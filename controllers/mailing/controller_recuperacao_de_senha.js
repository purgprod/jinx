const crypto = require('crypto');
const { enviarEmail } = require('../../mailer');
const { gerarTemplateSenha } = require('../../templates/template_recuperacao_de_senha');
const userModel = require('../../models/endpoints/model_autenticacao_purg');
const AtualizarSenhaModel = require('../../models/usuarios/model_atualizarsenha_usuarios');
const logger = require('../../logger');

function gerarSenhaAleatoria() {
    return Array.from({ length: 6 }, () => crypto.randomInt(10)).join('');
}

/**
 * Processa o fluxo de recuperacao de senha:
 * busca o usuario, gera nova senha de 6 digitos, atualiza no banco e envia o e-mail.
 * @param {string} emailUsuario - O e-mail de destino.
 * @returns {{ sucesso: boolean, usuarioEncontrado: boolean }}
 */
async function fluxoRecuperacao(emailUsuario) {
    logger.info(`Iniciando processo de recuperacao de senha para: ${emailUsuario}`);

    try {
        // Busca o usuario pelo e-mail
        const usuario = await userModel.findUserByEmail(emailUsuario);

        if (!usuario) {
            logger.warn(`Recuperacao de senha: e-mail nao encontrado: ${emailUsuario}`);
            return { sucesso: false, usuarioEncontrado: false };
        }

        const novaSenha = gerarSenhaAleatoria();

        // Atualiza a senha no banco (ja faz o hash internamente)
        await AtualizarSenhaModel.atualizarSenha(usuario.usuario_id, novaSenha);
        logger.info(`Senha atualizada no banco para o usuario ID: ${usuario.usuario_id}`);

        // Envia o e-mail com a nova senha
        const html = gerarTemplateSenha(novaSenha);
        const enviado = await enviarEmail(emailUsuario, 'Recuperação de Senha - Purg', html);

        if (enviado) {
            logger.info(`E-mail de recuperacao enviado com sucesso para: ${emailUsuario}`);
            return { sucesso: true, usuarioEncontrado: true };
        } else {
            logger.error(`Falha no envio do e-mail para: ${emailUsuario}`);
            return { sucesso: false, usuarioEncontrado: true };
        }

    } catch (error) {
        logger.error(`Erro critico no fluxo de recuperacao: ${error.message}`);
        return { sucesso: false, usuarioEncontrado: true };
    }
}

module.exports = { fluxoRecuperacao };
