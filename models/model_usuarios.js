const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // Importando a biblioteca bcrypt

// Configurar pool de conexão com o MySQL usando as configurações fornecidas
const pool = mysql.createPool({
    host: '18.191.123.39', // Host do banco de dados
    user: 'admin',         // Usuário do banco de dados
    database: 'usuarios',  // Nome do banco de dados
    password: 'Purgtrihold', // Senha do banco de dados
});

class UsersModel {
    // Método para obter usuários
    static async getUsers() {
        const query = 'SELECT * FROM users'; // Query para selecionar todos os usuários
        try {
            const [rows] = await pool.query(query); // Executa a query
            return rows; // Retorna os usuários
        } catch (error) {
            console.error(`Erro ao obter usuários: ${error.message}`);
            throw error; // Lança o erro para ser tratado no endpoint
        }
    }

    // Método para obter o próximo usuario_id
    static async getNextUserId() {
        const query = 'SELECT MAX(usuario_id) AS maxId FROM users'; // Query para obter o maior usuario_id
        try {
            const [rows] = await pool.query(query); // Executa a query
            return rows[0].maxId ? rows[0].maxId + 1 : 1; // Retorna o próximo id ou 1 se não existir
        } catch (error) {
            console.error(`Erro ao obter próximo usuario_id: ${error.message}`);
            throw error; // Lança o erro para ser tratado no endpoint
        }
    }

    // Método para atualizar a senha com hashing
    static async updatePassword(usuarioId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10); // Faz o hash da nova senha

        const query = `
            UPDATE users
            SET password = ?
            WHERE \`usuario_id\` = ?
        `;

        try {
            const [result] = await pool.execute(query, [hashedPassword, usuarioId]);
            if (result.affectedRows === 0) {
                throw new Error('Usuário não encontrado ou senha não alterada.');
            }
        } catch (error) {
            console.error(`Erro ao atualizar a senha: ${error.message}`);
            throw error; // Re-lança o erro para ser tratado no endpoint
        }
    }

    // Método para criar um novo usuário
    static async createUser({ usuario_id, nome, email, password }) { // Remover created_at
        const hashedPassword = await bcrypt.hash(password, 10); // Faz o hash da senha antes de salvar

        const query = `
            INSERT INTO users (usuario_id, nome, email, password)
            VALUES (?, ?, ?, ?)
        `;

        try {
            await pool.execute(query, [usuario_id, nome, email, hashedPassword]); // Insere o novo usuário no banco
        } catch (error) {
            console.error(`Erro ao criar usuário: ${error.message}`);
            throw error; // Lança o erro para ser tratado no endpoint
        }
    }

    // Método para obter um usuário pelo e-mail
    static async getUserByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?'; // Query para buscar usuário pelo e-mail

        try {
            const [rows] = await pool.query(query, [email]); // Executa a query
            return rows[0]; // Retorna o primeiro usuário encontrado, ou undefined se não existir
        } catch (error) {
            console.error(`Erro ao obter usuário pelo e-mail: ${error.message}`);
            throw error; // Lança o erro para ser tratado no endpoint
        }
    }

    // Método para excluir um usuário
    static async deleteUser(usuarioId) {
        const query = 'DELETE FROM users WHERE usuario_id = ?'; // Query para excluir o usuário
        try {
            const [result] = await pool.execute(query, [usuarioId]); // Executa a query
            if (result.affectedRows === 0) {
                throw new Error('Usuário não encontrado.');
            }
        } catch (error) {
            console.error(`Erro ao excluir usuário: ${error.message}`);
            throw error; // Lança o erro para ser tratado no endpoint
        }
    }
}

module.exports = UsersModel; // Exporta o modelo para uso em outras partes do aplicativo
