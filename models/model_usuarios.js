const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // Importando a biblioteca bcrypt

// Configurar pool de conexão com o MySQL usando as configurações fornecidas
const pool = mysql.createPool({
    host: '18.219.7.151', // Host do banco de dados
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
    static async createUser({ nome, email, password }) {
        const hashedPassword = await bcrypt.hash(password, 10); // Faz o hash da senha antes de salvar

        const query = `
            INSERT INTO users (nome, email, password)
            VALUES (?, ?, ?)
        `;

        try {
            await pool.execute(query, [nome, email, hashedPassword]); // Insere o novo usuário no banco
        } catch (error) {
            console.error(`Erro ao criar usuário: ${error.message}`);
            throw error; // Lança o erro para ser tratado no endpoint
        }
    }
}

module.exports = UsersModel; // Exporta o modelo para uso em outras partes do aplicativo
