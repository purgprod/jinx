const pool   = require('../../database/database_purg');
const logger = require('../../logger');

const MAX_TENTATIVAS  = 5;
const BLOQUEIO_MINUTOS = 30;

exports.registrarFalha = async (usuarioId) => {
    const query = `
        UPDATE users
        SET senha_negociacao_tentativas = senha_negociacao_tentativas + 1,
            senha_negociacao_bloqueio_ate = CASE
                WHEN senha_negociacao_tentativas + 1 >= ?
                THEN DATE_ADD(NOW(), INTERVAL ? MINUTE)
                ELSE NULL
            END
        WHERE usuario_id = ?
    `;
    try {
        await pool.promise().execute(query, [MAX_TENTATIVAS, BLOQUEIO_MINUTOS, usuarioId]);
        logger.warn(`Falha de PIN de negociação registrada para o usuário ID: ${usuarioId}`);
    } catch (error) {
        logger.error(`Erro ao registrar falha de PIN para o usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};

exports.zerarTentativas = async (usuarioId) => {
    const query = `
        UPDATE users
        SET senha_negociacao_tentativas = 0,
            senha_negociacao_bloqueio_ate = NULL
        WHERE usuario_id = ?
    `;
    try {
        await pool.promise().execute(query, [usuarioId]);
    } catch (error) {
        logger.error(`Erro ao zerar tentativas de PIN para o usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};
