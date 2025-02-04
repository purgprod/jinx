const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

class UsersAtualizarSenhaModel {

    // Método para reset de senha com a hashing
    static async atualizarSenha(usuarioId, novaSenha) {
        logger.info(`Iniciando a atualização de senha para o usuário ID: ${usuarioId}`);
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        const query = `
            UPDATE users
            SET password = ?
            WHERE \`usuario_id\` = ?
        `;
        try {
            const [result] = await connection.promise().execute(query, [hashedPassword, usuarioId]);
            if (result.affectedRows === 0) {
                const message = 'Usuário não encontrado ou senha não alterada.';
                logger.warn(message);
                throw new Error(message);
            }
            logger.info('Senha atualizada com sucesso.');
        } catch (error) {
            logger.error(`Erro ao atualizar a senha: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UsersAtualizarSenhaModel;

