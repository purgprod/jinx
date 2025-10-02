const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersNextUserIdModel {

    // Método para obter o próximo usuario_id
    static async getNextUserId() {
        const query = 'SELECT MAX(usuario_id) AS maxId FROM users';
        logger.info('Recuperando o próximo ID de usuário.');

        try {
            const [rows] = await connection.promise().query(query);
            const nextId = rows[0].maxId ? rows[0].maxId + 1 : 1;
            logger.info(`Próximo usuario_id será: ${nextId}`);

            return nextId; // Retorna o próximo ID
        } catch (error) {
            logger.error(`Erro ao obter próximo usuario_id: ${error.message}`);
            // Mova o log de rows aqui se você combinar com outro log no catch
            throw error; // Apenas lança o erro
        }
    }
}

module.exports = UsersNextUserIdModel;

