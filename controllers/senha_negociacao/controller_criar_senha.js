const { validationResult } = require('express-validator');
const senhaBuscarModel     = require('../../models/senha_negociacao/model_senha_buscar');
const senhaSalvarModel     = require('../../models/senha_negociacao/model_senha_salvar');
const logger               = require('../../logger');

async function criarSenha(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = parseInt(req.params.id, 10);
    const { senha, senha_confirmacao } = req.body;

    if (req.session.user.id !== usuarioId) {
        logger.warn(`Acesso negado à criação de Senha de Negociação. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    if (senha !== senha_confirmacao) {
        return res.status(400).json({ success: false, message: 'As senhas informadas não coincidem.' });
    }

    try {
        const dados = await senhaBuscarModel.buscarSenhaPorId(usuarioId);
        if (!dados) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        if (dados.senha_negociacao) {
            return res.status(409).json({ success: false, message: 'Você já possui uma Senha de Negociação cadastrada. Use a opção de alteração.' });
        }

        await senhaSalvarModel.salvarSenha(usuarioId, senha);

        logger.info(`Senha de Negociação criada para o usuário ID: ${usuarioId}`);
        return res.status(201).json({ success: true, message: 'Senha de Negociação cadastrada com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao criar Senha de Negociação para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { criarSenha };
