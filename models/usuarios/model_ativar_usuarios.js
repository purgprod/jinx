const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersAtivarModel {

    // Método para ativar um usuário
    static async ativarUsuario(id) {
        const sqlQuery = `UPDATE users SET status_ativo = 1 WHERE usuario_id = ?`;
        logger.info(`Iniciando ativação de usuario com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao ativar usuario com ID: ${id} - ${error.message}`);
                    reject(error);
                } else {
                    if (results.affectedRows > 0) {
                        logger.info(`Usuário com ID: ${id} ativado com sucesso.`);
                    } else {
                        logger.warn(`Nenhum usuario foi ativado para o ID: ${id}. Verifique se este ID existe.`);
                    }
                    logger.info(`Resultados da query: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`); // Loga a resposta aqui, após results ser definido
                    resolve(results);
                }
            });
        });
    }
}

module.exports = UsersAtivarModel;

