'use strict';

const logger             = require('../../logger');
const RankingGlobalModel = require('../../models/webhook/model_ranking_global');

function formatarEntrada(row) {
    if (!row) return null;
    return {
        posicao: row.posicao,
        apelido: row.apelido,
        pontos:  row.pontos,
        liga:    row.liga,
    };
}

const RankingGlobalController = {
    async get(req, res) {
        const { celular } = req.query;

        if (!celular || !/^\d{10,11}$/.test(celular)) {
            return res.status(400).json({ error: 'Informe o celular com DDD (10 ou 11 dígitos).' });
        }

        try {
            const usuario = await RankingGlobalModel.buscarUsuarioPorCelular(celular);
            if (!usuario) {
                return res.status(404).json({ error: 'Usuário não encontrado no ranking.' });
            }

            const total  = await RankingGlobalModel.buscarTotal();
            const pos    = usuario.posicao;

            // Coleta posições únicas necessárias
            const posSet = new Set([1, 2, 3]);
            for (let offset = -2; offset <= 2; offset++) {
                const p = pos + offset;
                if (p >= 1 && p <= total) posSet.add(p);
            }

            const rows   = await RankingGlobalModel.buscarPorPosicoes([...posSet]);
            const byPos  = (p) => formatarEntrada(rows.find(r => r.posicao === p) || null);

            // dois_a_frente e um_a_frente só aparecem se não estiverem no top 3
            const doisAFrente = pos - 2;
            const umAFrente   = pos - 1;
            const umATras     = pos + 1;
            const doisATras   = pos + 2;

            return res.json({
                usuario_id: usuario.usuario_id,
                posicao:    pos,
                total,
                ranking: {
                    primeiro:      byPos(1),
                    segundo:       byPos(2),
                    terceiro:      byPos(3),
                    dois_a_frente: doisAFrente > 3 ? byPos(doisAFrente) : null,
                    um_a_frente:   umAFrente   > 3 ? byPos(umAFrente)   : null,
                    usuario:       byPos(pos),
                    um_a_tras:     umATras  <= total ? byPos(umATras)  : null,
                    dois_a_tras:   doisATras <= total ? byPos(doisATras) : null,
                },
            });

        } catch (err) {
            logger.error('[Webhook] Erro ao buscar ranking global', { celular, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao buscar ranking.' });
        }
    },
};

module.exports = RankingGlobalController;
