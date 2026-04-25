const { validationResult }      = require('express-validator');
const recuperacaoBuscarModel    = require('../../models/senha_negociacao/model_recuperacao_buscar');
const recuperacaoInvalidarModel = require('../../models/senha_negociacao/model_recuperacao_invalidar');
const pinSalvarModel            = require('../../models/senha_negociacao/model_pin_salvar');
const logger                    = require('../../logger');

async function recuperarConfirmar(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, pin_novo, pin_confirmacao } = req.body;

    if (pin_novo !== pin_confirmacao) {
        return res.status(400).json({ success: false, message: 'Os PINs informados não coincidem.' });
    }

    try {
        const registro = await recuperacaoBuscarModel.buscarTokenValido(token);

        if (!registro) {
            logger.warn(`Token de recuperação de PIN inválido ou expirado: ${token.substring(0, 8)}...`);
            return res.status(400).json({ success: false, message: 'Link de recuperação inválido ou expirado. Solicite um novo.' });
        }

        await pinSalvarModel.salvarPin(registro.usuario_id, pin_novo);
        await recuperacaoInvalidarModel.invalidarToken(registro.id);

        logger.info(`PIN de negociação redefinido via recuperação para o usuário ID: ${registro.usuario_id}`);
        return res.status(200).json({ success: true, message: 'Senha de Negociação redefinida com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao confirmar recuperação de PIN: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { recuperarConfirmar };
