// models/ranking/model_ranking.js
// Leitura da tabela ranking (mantida atualizada por trigger no banco).

const pool = require('../../database/database_purg');

const RankingModel = {
    /**
     * Retorna todos os usuários do ranking ordenados por posição ascendente.
     * @returns {{ posicao, usuario_id, nome, pontos, liga, atualizado_em }[]}
     */
    async getRanking() {
        const [rows] = await pool.promise().execute(
            'SELECT posicao, usuario_id, apelido, pontos, liga, avatar_id FROM ranking ORDER BY posicao ASC'
        );
        return rows;
    },
};

module.exports = RankingModel;
