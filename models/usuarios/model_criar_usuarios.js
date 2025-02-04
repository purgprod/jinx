const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

class UsersCriarModel {

    // Método para criar um novo usuário
    static async createUser({ usuario_id, nome, email, password }) {
        logger.info(`Iniciando a criação de usuário para o e-mail: ${email}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (usuario_id, nome, email, password)
            VALUES (?, ?, ?, ?)
        `;
        try {
            await connection.promise().execute(query, [usuario_id, nome, email, hashedPassword]);
            logger.info('Usuário criado com sucesso.');
        } catch (error) {
            logger.error(`Erro ao criar usuário: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UsersCriarModel;

