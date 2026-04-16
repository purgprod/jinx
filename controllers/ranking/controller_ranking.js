// controllers/ranking/controller_ranking.js
// Retorna o ranking de usuários por pontos, lido diretamente da tabela
// ranking (mantida atualizada por trigger no banco de dados).

'use strict';

const logger       = require('../../logger');
const RankingModel = require('../../models/ranking/model_ranking');

const RankingController = {
    async getRanking(req, res) {
        try {
            const ranking = await RankingModel.getRanking();
            return res.status(200).json(ranking);
        } catch (err) {
            logger.error('[Ranking] Erro ao buscar ranking de pontos', { erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao buscar ranking.' });
        }
    },
};

module.exports = RankingController;
