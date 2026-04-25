const pool   = require('../../database/database_purg');
const logger = require('../../logger');

exports.buscarTokenValido = async (token) => {
    const query = `
        SELECT id, usuario_id
        FROM senha_negociacao_recuperacao
        WHERE token = ?
          AND usado = 0
          AND expira_em > NOW()
    `;
    try {
        const [rows] = await pool.promise().execute(query, [token]);
        return rows.length ? rows[0] : null;
    } catch (error) {
        logger.error(`Erro ao buscar token de recuperação de PIN: ${error.message}`);
        throw error;
    }
};
