const MetaVencidaModel = require('../../models/webhook/model_meta_vencida');
const NotificacoesModel = require('../../models/webhook/model_notificacoes');
const logger = require('../../logger');

const NamiMetaVencidaController = {
    async executar(_req, res) {
        try {
            const rows = await MetaVencidaModel.buscarMetasVencidas();

            if (rows.length === 0) {
                return res.json({ enfileirados: 0, ignorados: 0, mensagem: 'Nenhuma meta vencida há mais de 10 dias.' });
            }

            const porUsuario = new Map();
            for (const row of rows) {
                if (!porUsuario.has(row.usuario_id)) {
                    porUsuario.set(row.usuario_id, { usuario_id: row.usuario_id, metas: [] });
                }
                porUsuario.get(row.usuario_id).metas.push({
                    objetivo_nome: row.objetivo_nome,
                    meta_numero:   row.meta_numero,
                    valor_meta:    parseFloat(row.valor_meta),
                    valor_alocado: parseFloat(row.valor_alocado),
                    percentual:    parseFloat((row.valor_alocado / row.valor_meta * 100).toFixed(1)),
                    data_limite:   row.data_limite,
                    dias_atraso:   row.dias_atraso,
                });
            }

            let enfileirados = 0;
            let ignorados = 0;

            for (const usuario of porUsuario.values()) {
                const jaNotificado = await MetaVencidaModel.jaFoiNotificado(usuario.usuario_id);
                if (jaNotificado) {
                    ignorados++;
                    continue;
                }
                await NotificacoesModel.criar(usuario.usuario_id, 'meta_vencida', { metas: usuario.metas });
                enfileirados++;
            }

            logger.info(`[Nami] Metas vencidas: ${enfileirados} enfileirados, ${ignorados} já notificados nos últimos 30 dias.`);
            res.json({ enfileirados, ignorados });

        } catch (error) {
            logger.error('[Nami] Erro ao verificar metas vencidas:', error);
            res.status(500).json({ error: 'Erro interno ao verificar metas vencidas.' });
        }
    },
};

module.exports = NamiMetaVencidaController;
