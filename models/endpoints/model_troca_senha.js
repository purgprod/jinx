// models/endpoints/model_troca_senha.js

const pool   = require('../../database/database_purg');
const bcrypt = require('bcrypt');
const logger = require('../../logger');

exports.buscarSenhaPorId = async (usuarioId) => {
    const query = 'SELECT password FROM users WHERE usuario_id = ?';
    try {
        const [results] = await pool.promise().execute(query, [usuarioId]);
        if (!Array.isArray(results) || results.length === 0) return null;
        return results[0].password;
    } catch (error) {
        logger.error(`Erro ao buscar senha do usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};

exports.atualizarSenha = async (usuarioId, novaSenha) => {
    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    const query = 'UPDATE users SET password = ? WHERE usuario_id = ?';
    try {
        const [result] = await pool.promise().execute(query, [hashedPassword, usuarioId]);
        if (result.affectedRows === 0) {
            throw new Error('Usuário não encontrado ou senha não alterada.');
        }
        logger.info(`Senha atualizada com sucesso para o usuário ID: ${usuarioId}`);
    } catch (error) {
        logger.error(`Erro ao atualizar senha do usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};
