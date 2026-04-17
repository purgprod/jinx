const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BiometriaModel = {

    async buscarUsuarioPorEmail(email) {
        const query = `
            SELECT usuario_id, email, nome_completo
            FROM users
            WHERE email = ? AND status_ativo = 1
            LIMIT 1
        `;
        const [rows] = await connection.promise().query(query, [email]);
        return rows[0] || null;
    },

    async buscarDadosSessaoPorId(usuario_id) {
        const query = `
            SELECT usuario_id, email, nome_completo
            FROM users
            WHERE usuario_id = ?
            LIMIT 1
        `;
        const [rows] = await connection.promise().query(query, [usuario_id]);
        return rows[0] || null;
    },

    async salvarCredencial({ usuario_id, credential_id, public_key, counter, device_type }) {
        const query = `
            INSERT INTO user_credentials (usuario_id, credential_id, public_key, counter, device_type)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await connection.promise().query(
            query,
            [usuario_id, credential_id, public_key, counter, device_type || null]
        );
        logger.info(`[Biometria] Credencial salva — usuario_id: ${usuario_id}`);
        return result;
    },

    async buscarCredencialPorId(credential_id) {
        const query = 'SELECT * FROM user_credentials WHERE credential_id = ? LIMIT 1';
        const [rows] = await connection.promise().query(query, [credential_id]);
        return rows[0] || null;
    },

    async buscarCredenciaisPorUsuario(usuario_id) {
        const query = 'SELECT * FROM user_credentials WHERE usuario_id = ?';
        const [rows] = await connection.promise().query(query, [usuario_id]);
        return rows;
    },

    async atualizarCounter(credential_id, counter) {
        const query = 'UPDATE user_credentials SET counter = ? WHERE credential_id = ?';
        const [result] = await connection.promise().query(query, [counter, credential_id]);
        return result;
    },

    async deletarCredencial(credential_id, usuario_id) {
        const query = 'DELETE FROM user_credentials WHERE credential_id = ? AND usuario_id = ?';
        const [result] = await connection.promise().query(query, [credential_id, usuario_id]);
        return result;
    }
};

module.exports = BiometriaModel;
