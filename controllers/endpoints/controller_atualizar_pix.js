const { validationResult } = require('express-validator');
const atualizarPixModel    = require('../../models/endpoints/model_atualizar_pix');
const logger               = require('../../logger');

const CAMPOS_PIX = ['pix_cpf', 'pix_celular', 'pix_email', 'pix_chave'];

async function atualizarPix(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = parseInt(req.params.id, 10);

    if (req.session.user.id !== usuarioId) {
        logger.warn(`Tentativa de edição de Pix não autorizada. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    const campos = {};
    for (const campo of CAMPOS_PIX) {
        if (req.body[campo] !== undefined) {
            campos[campo] = req.body[campo];
        }
    }

    if (Object.keys(campos).length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhum campo Pix enviado para atualização.' });
    }

    try {
        await atualizarPixModel.atualizarPix(usuarioId, campos);
        logger.info(`Chaves Pix do usuário ID ${usuarioId} atualizadas com sucesso.`);
        return res.status(200).json({ success: true, message: 'Chaves Pix atualizadas com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao atualizar chaves Pix do usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { atualizarPix };
