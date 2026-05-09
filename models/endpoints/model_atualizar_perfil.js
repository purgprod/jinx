// models/endpoints/model_atualizar_perfil.js

const pool   = require('../../database/database_purg');
const logger = require('../../logger');

const CAMPOS_PERMITIDOS = [
    'apelido',
    'nome_completo',
    'genero',
    'celular',
    'cep',
    'logradouro',
    'numero_da_rua',
    'complemento',
    'bairro',
    'cidade',
    'estado',
];

exports.apelidoEmUso = async (apelido, usuarioId) => {
    const [rows] = await pool.promise().execute(
        'SELECT usuario_id FROM users WHERE LOWER(apelido) = LOWER(?) AND usuario_id <> ?',
        [apelido, usuarioId]
    );
    return rows.length > 0;
};

exports.atualizarPerfil = async (usuarioId, campos) => {
    const chaves = Object.keys(campos).filter(k => CAMPOS_PERMITIDOS.includes(k));

    if (chaves.length === 0) {
        throw new Error('Nenhum campo válido para atualizar.');
    }

    const setClause = chaves.map(k => `${k} = ?`).join(', ');
    const valores   = chaves.map(k => campos[k]);
    valores.push(usuarioId);

    const query = `UPDATE users SET ${setClause} WHERE usuario_id = ?`;

    try {
        const [result] = await pool.promise().execute(query, valores);
        if (result.affectedRows === 0) {
            throw new Error('Usuário não encontrado.');
        }
        logger.info(`Perfil atualizado com sucesso para o usuário ID: ${usuarioId}`);
        return result;
    } catch (error) {
        logger.error(`Erro ao atualizar perfil do usuário ID ${usuarioId}: ${error.message}`);
        throw error;
    }
};
