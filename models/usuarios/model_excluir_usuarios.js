const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

class UsersExcluirModel {

    // Método para excluir um usuário
    static async deleteUser(usuarioId) {
        logger.info(`Iniciando exclusão de usuário com ID: ${usuarioId}`);
        const query = 'DELETE FROM users WHERE usuario_id = ?';
        try {
            const [result] = await connection.promise().execute(query, [usuarioId]);
            if (result.affectedRows === 0) {
                const message = 'Usuário não encontrado.';
                logger.warn(message);
                throw new Error(message);
            }
            logger.info('Usuário excluído com sucesso.');
        } catch (error) {
            logger.error(`Erro ao excluir usuário: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UsersExcluirModel;

