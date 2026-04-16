// controllers/ranking/controller_ranking.js
// Retorna o ranking de usuários por pontos, lido diretamente da tabela
// ranking_pontos (mantida atualizada por trigger no banco de dados).

'use strict';

const logger            = require('../../logger');
const RankingPontosModel = require('../../models/ranking/model_ranking_pontos');

const RankingController = {
    async getRanking(req, res) {
        try {
            const ranking = await RankingPontosModel.getRanking();
            return res.status(200).json(ranking);
        } catch (err) {
            logger.error('[Ranking] Erro ao buscar ranking de pontos', { erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao buscar ranking.' });
        }
    },
};

module.exports = RankingController;
