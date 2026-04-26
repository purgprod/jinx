const pool   = require('../../database/database_purg');
const logger = require('../../logger');

const EXPIRACAO_MINUTOS = 15;

exports.criarTokenRecuperacao = async (usuarioId, token) => {
    const query = `
        INSERT INTO senha_negociacao_recuperacao (usuario_id, token, expira_em)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
    `;
    try {
        await pool.promise().execute(query, [usuarioId, token, EXPIRACAO_MINUTOS]);
        logger.info(`Token de recuperação de Senha de Negociação criado para o usuário ID: ${usuarioId}`);
    } catch (error) {
        logger.error(`Erro ao criar token de recuperação de Senha de Negociação para o usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};
