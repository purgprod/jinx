const { enviarEmail } = require('../../mailer');
const { gerarTemplateSenha } = require('../../templates/template_recuperacao_de_senha');
const logger = require('../../logger');

/**
 * Processa o fluxo de geracao de nova senha e envio de e-mail.
 * @param {string} emailUsuario - O e-mail de destino.
 */
async function fluxoRecuperacao(emailUsuario) {
    logger.info(`Iniciando processo de recuperacao de senha para: ${emailUsuario}`);
    
    try {
        // Gera uma senha aleatoria de 8 caracteres (letras e numeros)
        const novaSenha = Math.random().toString(36).toUpperCase().substring(2, 10);
        
        // Renderiza o HTML do template
        const html = gerarTemplateSenha(novaSenha);
        
        // Dispara o e-mail atraves do motor SMTP
        const enviado = await enviarEmail(
            emailUsuario, 
            "Recuperacao de Senha - Purg", 
            html
        );

        if (enviado) {
            logger.info(`E-mail de recuperacao enviado com sucesso para: ${emailUsuario}`);
            return true;
        } else {
            logger.error(`Falha no motor de envio para o e-mail: ${emailUsuario}`);
            return false;
        }
    } catch (error) {
        logger.error(`Erro critico no fluxo de recuperacao: ${error.message}`);
        return false;
    }
}

module.exports = { fluxoRecuperacao };
