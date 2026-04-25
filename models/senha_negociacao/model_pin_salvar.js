const pool   = require('../../database/database_purg');
const bcrypt = require('bcrypt');
const logger = require('../../logger');

exports.salvarPin = async (usuarioId, pinPlano) => {
    const hash = await bcrypt.hash(pinPlano, 12);
    const query = `
        UPDATE users
        SET senha_negociacao = ?,
            senha_negociacao_tentativas = 0,
            senha_negociacao_bloqueio_ate = NULL
        WHERE usuario_id = ?
    `;
    try {
        const [result] = await pool.promise().execute(query, [hash, usuarioId]);
        if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
        logger.info(`PIN de negociação salvo para o usuário ID: ${usuarioId}`);
    } catch (error) {
        logger.error(`Erro ao salvar PIN de negociação do usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};
