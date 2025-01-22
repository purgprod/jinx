const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../database/database_usuarios');
const crowdfundingConnection = require('../database/database_crowdfunding');
const logger = require('../logger');

class UsersModel {
    // Método para obter usuários
    static async getUsers() {
        const query = 'SELECT * FROM users';
        logger.info('Iniciando a recuperação de todos os usuários.');
        try {
            const [rows] = await connection.promise().query(query);
            logger.info(`Número de usuários recuperados: ${rows.length}`);
            return rows;
        } catch (error) {
            logger.error(`Erro ao obter usuários: ${error.message}`);
            throw error;
        }
    }

    // Método para obter o próximo usuario_id
    static async getNextUserId() {
        const query = 'SELECT MAX(usuario_id) AS maxId FROM users';
        logger.info('Recuperando o próximo ID de usuário.');
        try {
            const [rows] = await connection.promise().query(query);
            const nextId = rows[0].maxId ? rows[0].maxId + 1 : 1;
            logger.info(`Próximo usuario_id será: ${nextId}`);
            return nextId;
        } catch (error) {
            logger.error(`Erro ao obter próximo usuario_id: ${error.message}`);
            throw error;
        }
    }

    // Método para atualizar a senha com hashing
    static async updatePassword(usuarioId, newPassword) {
        logger.info(`Iniciando a atualização de senha para o usuário ID: ${usuarioId}`);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
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
                    logger.info(`Resultados da query: ${JSON.stringify(results)}`);
                    resolve(results);
                }
            });
        });
    }

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
                    logger.info(`Resultados da query: ${JSON.stringify(results)}`);
                    resolve(results);
                }
            });
        });
    }

    // Método para buscar tokens associados a um usuário
    static async tokensUsuario(usuarioId) {
        const query = `
            SELECT u.*, t.razao_social, t.risco, t.valor_token, t.rendimento_token, t.vencimento, t.dias_vencimento
            FROM usuario_tokens u
            INNER JOIN tokens t
            ON u.token_id = t.id_token
            WHERE usuario_id = ?
        `;
        logger.info(`Recuperando tokens para o usuário com ID: ${usuarioId}`);

        try {
            const [rows] = await crowdfundingConnection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Tokens encontrados para o usuário com ID: ${usuarioId}`);
            } else {
                logger.warn(`Nenhum token encontrado para o usuário com ID: ${usuarioId}`);
            }
            return rows;
        } catch (error) {
            logger.error(`Erro ao buscar tokens para o usuário com ID: ${usuarioId} - ${error.message}`);
            throw error;
        }
    }
}

module.exports = UsersModel;

