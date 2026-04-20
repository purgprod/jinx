// models/endpoints/model_criar_novo_usuario.js
const pool = require('../../database/database_purg');
const logger = require('../../logger');

exports.createCarteira = async (usuarioId, conn = null) => {
    const query = `INSERT INTO carteiras (usuario_id) VALUES (?)`;
    try {
        const [result] = conn
            ? await conn.execute(query, [usuarioId])
            : await pool.promise().execute(query, [usuarioId]);
        return result;
    } catch (error) {
        logger.error(`Erro ao criar carteira para usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};

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

exports.createUser = async ({ nome_completo, data_nascimento, genero, cpf, celular, email, hashedPassword,
                               termos_de_uso, termos_de_privacidade, termos_de_riscos_da_plataforma }, conn = null) => {
    const query = `
        INSERT INTO users (nome_completo, data_nascimento, genero, cpf, celular, email, password, termos_de_uso, termos_de_privacidade, termos_de_riscos_da_plataforma)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [nome_completo, data_nascimento, genero, cpf, celular, email, hashedPassword,
                    termos_de_uso, termos_de_privacidade, termos_de_riscos_da_plataforma];
    try {
        const [result] = conn
            ? await conn.execute(query, params)
            : await pool.promise().execute(query, params);
        logger.info(`Novo usuário criado com sucesso. ID: ${result.insertId}`);
        return result.insertId;
    } catch (error) {
        logger.error(`Erro ao inserir novo usuário: ${error.message}`);
        throw error;
    }
};
