const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

class UsersUpdateModel {

    // Método para atualizar um usuário
    static async updateUsuario(id, data) {
        const sqlQuery = `
            UPDATE users
            SET email = ?, nome = ?
            WHERE usuario_id = ?
        `;
        const values = [data.email, data.nome, id];

        logger.info(`Executando update para usuario com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, values, (error, results) => {
                if (error) {
                    logger.error(`Erro ao atualizar usuario com ID: ${id} - ${error.message}`);
                    reject(error);
                } else {
                    logger.info(`Usuário com ID: ${id} atualizado com sucesso.`);
                    logger.info(`Resultados da query: ${JSON.stringify(results)}`);
                    resolve(results);
                }
            });
        });
    }
}

module.exports = UsersUpdateModel;

