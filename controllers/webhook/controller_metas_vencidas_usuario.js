'use strict';

const logger                  = require('../../logger');
const MetasVencidasUsuario    = require('../../models/webhook/model_metas_vencidas_usuario');

const MetasVencidasUsuarioController = {
    async get(req, res) {
        const usuarioId = parseInt(req.params.usuario_id, 10);
        if (!usuarioId || usuarioId <= 0) {
            return res.status(400).json({ error: 'usuario_id inválido.' });
        }

        try {
            const metas = await MetasVencidasUsuario.buscarPorUsuario(usuarioId);

            return res.json({
                usuario_id: usuarioId,
                total:      metas.length,
                metas:      metas.map(m => ({
                    objetivo_nome: m.objetivo_nome,
                    meta_numero:   m.meta_numero,
                    valor_meta:    parseFloat(m.valor_meta),
                    valor_alocado: parseFloat(m.valor_alocado),
                    percentual:    parseFloat((m.valor_alocado / m.valor_meta * 100).toFixed(1)),
                    data_limite:   m.data_limite,
                    dias_atraso:   m.dias_atraso,
                })),
            });

        } catch (err) {
            logger.error('[Webhook] Erro ao buscar metas vencidas', { usuarioId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao buscar metas vencidas.' });
        }
    },
};

module.exports = MetasVencidasUsuarioController;
