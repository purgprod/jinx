const pool   = require('../../database/database_purg');
const logger = require('../../logger');

const CAMPOS_PIX = ['pix_cpf', 'pix_celular', 'pix_email', 'pix_chave'];

exports.atualizarPix = async (usuarioId, campos) => {
    const chaves = Object.keys(campos).filter(k => CAMPOS_PIX.includes(k));

    if (chaves.length === 0) {
        throw new Error('Nenhum campo Pix válido para atualizar.');
    }

    // Converte string vazia para NULL (limpar a chave)
    const valores = chaves.map(k => campos[k] === '' ? null : campos[k]);
    valores.push(usuarioId);

    const setClause = chaves.map(k => `${k} = ?`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE usuario_id = ?`;

    try {
        const [result] = await pool.promise().execute(query, valores);
        if (result.affectedRows === 0) throw new Error('Usuário não encontrado.');
        logger.info(`Chaves Pix atualizadas para o usuário ID: ${usuarioId}`);
        return result;
    } catch (error) {
        logger.error(`Erro ao atualizar chaves Pix do usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};
