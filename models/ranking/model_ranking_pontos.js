// models/ranking/model_ranking_pontos.js
// Leitura da tabela ranking_pontos (mantida atualizada por trigger no banco).

const pool = require('../../database/database_purg');

const RankingPontosModel = {
    /**
     * Retorna todos os usuários do ranking ordenados por posição ascendente.
     * @returns {{ posicao, usuario_id, nome, pontos, atualizado_em }[]}
     */
    async getRanking() {
        const [rows] = await pool.promise().execute(
            'SELECT posicao, usuario_id, nome, pontos FROM ranking_pontos ORDER BY posicao ASC'
        );
        return rows;
    },
};

module.exports = RankingPontosModel;
