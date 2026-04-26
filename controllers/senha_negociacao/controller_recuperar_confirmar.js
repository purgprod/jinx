const { validationResult }      = require('express-validator');
const recuperacaoBuscarModel    = require('../../models/senha_negociacao/model_recuperacao_buscar');
const recuperacaoInvalidarModel = require('../../models/senha_negociacao/model_recuperacao_invalidar');
const senhaSalvarModel          = require('../../models/senha_negociacao/model_senha_salvar');
const logger                    = require('../../logger');

async function recuperarConfirmar(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, senha_nova, senha_confirmacao } = req.body;

    if (senha_nova !== senha_confirmacao) {
        return res.status(400).json({ success: false, message: 'As senhas informadas não coincidem.' });
    }

    try {
        const registro = await recuperacaoBuscarModel.buscarTokenValido(token);

        if (!registro) {
            logger.warn(`Token de recuperação de Senha de Negociação inválido ou expirado: ${token.substring(0, 8)}...`);
            return res.status(400).json({ success: false, message: 'Link de recuperação inválido ou expirado. Solicite um novo.' });
        }

        await senhaSalvarModel.salvarSenha(registro.usuario_id, senha_nova);
        await recuperacaoInvalidarModel.invalidarToken(registro.id);

        logger.info(`Senha de Negociação redefinida via recuperação para o usuário ID: ${registro.usuario_id}`);
        return res.status(200).json({ success: true, message: 'Senha de Negociação redefinida com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao confirmar recuperação de Senha de Negociação: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { recuperarConfirmar };
