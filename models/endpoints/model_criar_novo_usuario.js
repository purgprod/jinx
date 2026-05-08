// models/endpoints/model_criar_novo_usuario.js
const crypto = require('crypto');
const pool   = require('../../database/database_purg');
const logger = require('../../logger');

exports.createCarteira = async (usuarioId, conn = null) => {
    const db = conn || pool.promise();
    try {
        const [result] = await db.execute(
            `INSERT INTO carteiras (usuario_id) VALUES (?)`,
            [usuarioId]
        );
        return result;
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            // Carteira órfã (sem usuário vinculado) — remove e recria dentro da mesma transação
            await db.execute(`DELETE FROM carteiras WHERE usuario_id = ?`, [usuarioId]);
            const [result] = await db.execute(
                `INSERT INTO carteiras (usuario_id) VALUES (?)`,
                [usuarioId]
            );
            logger.warn(`Carteira órfã removida e recriada para usuário ID ${usuarioId}`);
            return result;
        }
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

exports.createUser = async ({ nome_completo, nome_da_mae, data_nascimento, genero, cpf, celular, email, hashedPassword,
                               termos_de_uso, termos_de_privacidade, termos_de_riscos_da_plataforma }, conn = null) => {
    const codigo_indicacao = crypto.randomBytes(4).toString('hex');
    const query = `
        INSERT INTO users (nome_completo, nome_da_mae, data_nascimento, genero, cpf, celular, email, password, termos_de_uso, termos_de_privacidade, termos_de_riscos_da_plataforma, codigo_indicacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [nome_completo, nome_da_mae, data_nascimento, genero, cpf, celular, email, hashedPassword,
                    termos_de_uso, termos_de_privacidade, termos_de_riscos_da_plataforma, codigo_indicacao];
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
