const pool = require('../../database/database_purg');

const RankingDadosModel = {
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.promise().execute(
            `SELECT r.posicao, r.usuario_id, r.apelido, r.pontos, r.liga, r.avatar_id, r.created_at, r.estado,
                    (SELECT COUNT(i.indicado_id) FROM indicacoes i WHERE i.indicador_id = r.usuario_id) AS total_indicacoes
             FROM ranking_dados r WHERE r.usuario_id = ? LIMIT 1`,
            [usuarioId]
        );
        return rows[0] || null;
    },
};

module.exports = RankingDadosModel;
