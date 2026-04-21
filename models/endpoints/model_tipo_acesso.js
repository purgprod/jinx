// models/endpoints/model_tipo_acesso.js

const pool = require('../../database/database_purg');

exports.atualizarPreferenciaLogin = async (usuarioId, preferencia) => {
    const [result] = await pool.promise().execute(
        'UPDATE users SET preferencia_login = ? WHERE usuario_id = ?',
        [preferencia, usuarioId]
    );
    return result.affectedRows > 0;
};

exports.buscarPreferenciaLoginPorEmail = async (email) => {
    const [rows] = await pool.promise().execute(
        'SELECT preferencia_login FROM users WHERE email = ? LIMIT 1',
        [email]
    );
    if (!rows.length) return undefined;
    return rows[0].preferencia_login;
};
