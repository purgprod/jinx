// controllers/endpoints/controller_troca_senha.js

const bcrypt      = require('bcrypt');
const { validationResult } = require('express-validator');
const trocaSenhaModel = require('../../models/endpoints/model_troca_senha');
const logger      = require('../../logger');

async function trocarSenha(req, res) {
    // Verifica erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId  = parseInt(req.params.id, 10);
    const { senhaAtual, novaSenha } = req.body;

    // Proteção contra IDOR: o usuário só pode alterar a própria senha
    if (req.session.user.id !== usuarioId) {
        logger.warn(`Tentativa de troca de senha não autorizada. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    try {
        const hashAtual = await trocaSenhaModel.buscarSenhaPorId(usuarioId);

        if (!hashAtual) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        const senhaCorreta = await bcrypt.compare(senhaAtual, hashAtual);
        if (!senhaCorreta) {
            logger.info(`Senha atual incorreta na troca de senha para o usuário ID: ${usuarioId}`);
            return res.status(401).json({ success: false, message: 'Senha atual incorreta.' });
        }

        await trocaSenhaModel.atualizarSenha(usuarioId, novaSenha);

        logger.info(`Troca de senha realizada com sucesso para o usuário ID: ${usuarioId}`);
        return res.status(200).json({ success: true, message: 'Senha alterada com sucesso.' });

    } catch (error) {
        logger.error(`Erro na troca de senha para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { trocarSenha };
