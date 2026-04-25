const { validationResult } = require('express-validator');
const pinBuscarModel       = require('../../models/senha_negociacao/model_pin_buscar');
const pinSalvarModel       = require('../../models/senha_negociacao/model_pin_salvar');
const logger               = require('../../logger');

async function criarPin(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = parseInt(req.params.id, 10);
    const { pin, pin_confirmacao } = req.body;

    if (req.session.user.id !== usuarioId) {
        logger.warn(`Acesso negado à criação de PIN. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    if (pin !== pin_confirmacao) {
        return res.status(400).json({ success: false, message: 'Os PINs informados não coincidem.' });
    }

    try {
        const dados = await pinBuscarModel.buscarPinPorId(usuarioId);
        if (!dados) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        if (dados.senha_negociacao) {
            return res.status(409).json({ success: false, message: 'Você já possui uma Senha de Negociação cadastrada. Use a opção de alteração.' });
        }

        await pinSalvarModel.salvarPin(usuarioId, pin);

        logger.info(`PIN de negociação criado para o usuário ID: ${usuarioId}`);
        return res.status(201).json({ success: true, message: 'Senha de Negociação cadastrada com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao criar PIN de negociação para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { criarPin };
