const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersBuscarUsuarioModel {

    // Método para obter um usuário pelo e-mail
    static async getUserByEmail(email) {
        logger.info(`Recuperando usuário com e-mail: ${email}`);
        const query = `SELECT * FROM users WHERE email = ?`;
        try {
            const [rows] = await connection.promise().query(query, [email]);
            if (rows[0]) {
                logger.info('Usuário encontrado.');
            } else {
                logger.warn('Usuário não encontrado.');
            }
            return rows[0];
        } catch (error) {
            logger.error(`Erro ao obter usuário pelo e-mail: ${error.message}`);
	    throw error;
        }
    }
}

module.exports = UsersBuscarUsuarioModel;

