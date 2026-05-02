// models/endpoints/model_visualizacao_valores.js

const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class VisualizacaoValoresModel {

    static async get(usuarioId) {
        const [rows] = await pool.promise().query(
            'SELECT visualizacao_valores FROM users WHERE usuario_id = ?',
            [usuarioId]
        );
        if (rows.length === 0) return null;
        return rows[0].visualizacao_valores;
    }

    static async set(usuarioId, valor) {
        const [result] = await pool.promise().query(
            'UPDATE users SET visualizacao_valores = ? WHERE usuario_id = ?',
            [valor, usuarioId]
        );
        if (result.affectedRows === 0) return false;
        logger.info(`[VisualizacaoValores] Atualizado para usuário ${usuarioId}: ${valor}`);
        return true;
    }

}

module.exports = VisualizacaoValoresModel;
