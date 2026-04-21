// controllers/endpoints/controller_atualizar_perfil.js

const { validationResult } = require('express-validator');
const atualizarPerfilModel  = require('../../models/endpoints/model_atualizar_perfil');
const logger                = require('../../logger');

async function atualizarPerfil(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = parseInt(req.params.id, 10);

    // Proteção contra IDOR: o usuário só pode editar o próprio perfil
    if (req.session.user.id !== usuarioId) {
        logger.warn(`Tentativa de edição de perfil não autorizada. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    const CAMPOS_PERMITIDOS = [
        'apelido',
        'nome_completo',
        'genero',
        'celular',
        'cep',
        'logradouro',
        'numero_da_rua',
        'complemento',
        'pix_cpf',
        'pix_celular',
        'pix_email',
        'pix_chave',
    ];

    const campos = {};
    for (const campo of CAMPOS_PERMITIDOS) {
        if (req.body[campo] !== undefined) {
            campos[campo] = req.body[campo];
        }
    }

    if (Object.keys(campos).length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhum campo válido enviado para atualização.' });
    }

    try {
        if (campos.apelido !== undefined) {
            const emUso = await atualizarPerfilModel.apelidoEmUso(campos.apelido, usuarioId);
            if (emUso) {
                return res.status(409).json({ success: false, message: 'Esse apelido já está em uso. Escolha outro.' });
            }
        }

        await atualizarPerfilModel.atualizarPerfil(usuarioId, campos);
        logger.info(`Perfil do usuário ID ${usuarioId} atualizado com sucesso.`);
        return res.status(200).json({ success: true, message: 'Perfil atualizado com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao atualizar perfil do usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { atualizarPerfil };
