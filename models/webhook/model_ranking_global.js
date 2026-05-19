const pool = require('../../database/database_purg');
const logger = require('../../logger');

const RankingGlobalModel = {
    async buscarUsuarioPorCelular(celular) {
        const [rows] = await pool.promise().execute(
            `SELECT r.posicao, r.usuario_id, r.apelido, r.pontos, r.liga
             FROM ranking r
             INNER JOIN users u ON u.usuario_id = r.usuario_id
             WHERE u.celular = ?
             LIMIT 1`,
            [celular]
        );
        return rows[0] || null;
    },

    async buscarTotal() {
        const [rows] = await pool.promise().execute(
            'SELECT COUNT(*) AS total FROM ranking'
        );
        return Number(rows[0].total);
    },

    async buscarPorPosicoes(posicoes) {
        if (posicoes.length === 0) return [];
        const placeholders = posicoes.map(() => '?').join(',');
        const [rows] = await pool.promise().execute(
            `SELECT posicao, usuario_id, apelido, pontos, liga
             FROM ranking
             WHERE posicao IN (${placeholders})
             ORDER BY posicao ASC`,
            posicoes
        );
        return rows;
    },
};

module.exports = RankingGlobalModel;
