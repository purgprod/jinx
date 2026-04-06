const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersInativarModel {

    // Método para inativar um usuário
    static async inativarUsuario(id) {
        const sqlQuery = `UPDATE users SET status_ativo = 0 WHERE usuario_id = ?`;
        logger.info(`Iniciando inativação de usuario com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inativar usuario com ID: ${id} - ${error.message}`);
                    reject(error);
                } else {
                    if (results.affectedRows > 0) {
                        logger.info(`Usuário com ID: ${id} inativado com sucesso.`);
                    } else {
                        logger.warn(`Nenhum usuario foi inativado para o ID: ${id}. Verifique se este ID existe.`);
                    }
                    logger.info(`Resultados da query: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
                    resolve(results);
                }
            });
        });
    }
}

module.exports = UsersInativarModel;

