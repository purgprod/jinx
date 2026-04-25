const pool   = require('../../database/database_purg');
const logger = require('../../logger');

exports.invalidarToken = async (id) => {
    const query = 'UPDATE senha_negociacao_recuperacao SET usado = 1 WHERE id = ?';
    try {
        await pool.promise().execute(query, [id]);
        logger.info(`Token de recuperação de PIN ID ${id} marcado como usado.`);
    } catch (error) {
        logger.error(`Erro ao invalidar token de recuperação de PIN ID ${id}: ${error.message}`);
        throw error;
    }
};
