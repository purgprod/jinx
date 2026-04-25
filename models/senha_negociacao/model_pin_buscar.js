const pool   = require('../../database/database_purg');
const logger = require('../../logger');

exports.buscarPinPorId = async (usuarioId) => {
    const query = `
        SELECT senha_negociacao, senha_negociacao_tentativas, senha_negociacao_bloqueio_ate
        FROM users
        WHERE usuario_id = ?
    `;
    try {
        const [rows] = await pool.promise().execute(query, [usuarioId]);
        if (!rows.length) return null;
        return rows[0];
    } catch (error) {
        logger.error(`Erro ao buscar PIN de negociação do usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};
