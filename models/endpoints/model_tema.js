// models/endpoints/model_tema.js

const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class TemaModel {

    static async getTema(usuarioId) {
        const [rows] = await pool.promise().query(
            'SELECT tema FROM users WHERE usuario_id = ?',
            [usuarioId]
        );
        if (rows.length === 0) return null;
        logger.info(`[Tema] Tema consultado para usuário ${usuarioId}: ${rows[0].tema}`);
        return rows[0].tema;
    }

    static async setTema(usuarioId, tema) {
        const [result] = await pool.promise().query(
            'UPDATE users SET tema = ? WHERE usuario_id = ?',
            [tema, usuarioId]
        );
        if (result.affectedRows === 0) return false;
        logger.info(`[Tema] Tema atualizado para usuário ${usuarioId}: ${tema}`);
        return true;
    }

}

module.exports = TemaModel;
