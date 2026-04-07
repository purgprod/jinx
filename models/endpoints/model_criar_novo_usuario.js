// models/endpoints/model_criar_novo_usuario.js
const pool = require('../../database/database_purg');
const logger = require('../../logger');

exports.findByEmail = async (email) => {
    const [rows] = await pool.promise().execute(
        'SELECT usuario_id FROM users WHERE email = ? LIMIT 1',
        [email]
    );
    return rows[0] || null;
};

exports.findByCpf = async (cpf) => {
    const [rows] = await pool.promise().execute(
        'SELECT usuario_id FROM users WHERE cpf = ? LIMIT 1',
        [cpf]
    );
    return rows[0] || null;
};

exports.createUser = async ({ nome_completo, cpf, celular, email, hashedPassword }) => {
    const query = `
        INSERT INTO users (nome_completo, cpf, celular, email, password, termos_de_uso)
        VALUES (?, ?, ?, ?, ?, 1)
    `;
    try {
        const [result] = await pool.promise().execute(query, [
            nome_completo, cpf, celular, email, hashedPassword
        ]);
        logger.info(`Novo usuário criado com sucesso. ID: ${result.insertId}`);
        return result.insertId;
    } catch (error) {
        logger.error(`Erro ao inserir novo usuário: ${error.message}`);
        throw error;
    }
};
