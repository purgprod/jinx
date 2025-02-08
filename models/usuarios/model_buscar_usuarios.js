const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

class UsersBuscarModel {

// Método para obter usuários
    static async getUsers() {
        const query = 'SELECT * FROM users';
        logger.info('Iniciando a recuperação de todos os usuários.');
        try {
            const [rows] = await connection.promise().query(query);
            logger.info(`Número de usuários recuperados: ${rows.length}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    return rows;
        } catch (error) {
            logger.error(`Erro ao obter usuários: ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    throw error;
        }
    }
}

module.exports = UsersBuscarModel;

