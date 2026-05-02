// models/endpoints/model_avatar.js

const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class AvatarModel {

    static async getAvatar(usuarioId) {
        const [rows] = await pool.promise().query(
            'SELECT avatar_id FROM users WHERE usuario_id = ?',
            [usuarioId]
        );
        if (rows.length === 0) return null;
        return rows[0].avatar_id;
    }

    static async setAvatar(usuarioId, avatarId) {
        const [result] = await pool.promise().query(
            'UPDATE users SET avatar_id = ? WHERE usuario_id = ?',
            [avatarId, usuarioId]
        );
        if (result.affectedRows === 0) return false;
        logger.info(`[Avatar] Avatar atualizado para usuário ${usuarioId}: avatar_id=${avatarId}`);
        return true;
    }

}

module.exports = AvatarModel;
