const NotificacoesModel = require('../../models/webhook/model_notificacoes');
const VerificarMetasMensaisModel = require('../../models/webhook/model_verificar_metas_mensais');
const NamiToggleModel = require('../../models/webhook/model_nami_toggle');
const NamiBuscarPorCelularModel = require('../../models/webhook/model_nami_buscar_por_celular');
const logger = require('../../logger');

const NamiController = {
    async getPendentes(req, res) {
        const limite = Math.min(parseInt(req.query.limite) || 50, 100);
        const prioridade = req.query.prioridade || null;
        if (prioridade && prioridade !== 'urgente' && prioridade !== 'normal') {
            return res.status(400).json({ error: 'Valor inválido para prioridade. Use: urgente, normal.' });
        }
        try {
            const notificacoes = await NotificacoesModel.buscarPendentes(limite, prioridade);
            res.json({ total: notificacoes.length, notificacoes });
        } catch (error) {
            logger.error('[Nami] Erro ao buscar pendentes:', error);
            res.status(500).json({ error: 'Erro interno ao buscar notificações.' });
        }
    },

    async marcarEnviado(req, res) {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID inválido.' });
        try {
            const affected = await NotificacoesModel.marcarEnviado(id);
            if (affected === 0) return res.status(404).json({ error: 'Notificação não encontrada ou já processada.' });
            res.json({ success: true });
        } catch (error) {
            logger.error(`[Nami] Erro ao marcar enviado id=${id}:`, error);
            res.status(500).json({ error: 'Erro interno.' });
        }
    },

    async marcarFalhou(req, res) {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID inválido.' });
        try {
            const affected = await NotificacoesModel.marcarFalhou(id);
            if (affected === 0) return res.status(404).json({ error: 'Notificação não encontrada ou já processada.' });
            res.json({ success: true });
        } catch (error) {
            logger.error(`[Nami] Erro ao marcar falhou id=${id}:`, error);
            res.status(500).json({ error: 'Erro interno.' });
        }
    },

    async verificarMetasMensais(_req, res) {
        try {
            const rows = await VerificarMetasMensaisModel.buscarUsuariosComMetasIncompletas();

            if (rows.length === 0) {
                return res.json({ enfileirados: 0, mensagem: 'Nenhuma meta incompleta encontrada para o mês atual.' });
            }

            // Agrupa metas por usuário
            const porUsuario = new Map();
            for (const row of rows) {
                if (!porUsuario.has(row.usuario_id)) {
                    porUsuario.set(row.usuario_id, { usuario_id: row.usuario_id, celular: row.celular, metas: [] });
                }
                porUsuario.get(row.usuario_id).metas.push({
                    objetivo_nome: row.objetivo_nome,
                    meta_numero:   row.meta_numero,
                    valor_meta:    parseFloat(row.valor_meta),
                    valor_alocado: parseFloat(row.valor_alocado),
                    percentual:    parseFloat((row.valor_alocado / row.valor_meta * 100).toFixed(1)),
                    data_limite:   row.data_limite,
                });
            }

            let enfileirados = 0;
            let ignorados = 0;

            for (const usuario of porUsuario.values()) {
                const jaNotificado = await VerificarMetasMensaisModel.jaNotificadoHoje(usuario.usuario_id);
                if (jaNotificado) {
                    ignorados++;
                    continue;
                }
                await NotificacoesModel.criar(usuario.usuario_id, 'meta_mensal_incompleta', { metas: usuario.metas });
                enfileirados++;
            }

            logger.info(`[Nami] Verificação de metas mensais: ${enfileirados} enfileirados, ${ignorados} já notificados hoje.`);
            res.json({ enfileirados, ignorados });

        } catch (error) {
            logger.error('[Nami] Erro ao verificar metas mensais:', error);
            res.status(500).json({ error: 'Erro interno ao verificar metas mensais.' });
        }
    },
    async buscarPorCelular(req, res) {
        const celular = (req.query.celular || '').trim().replace(/\D/g, '');
        if (!celular) return res.status(400).json({ error: 'Parâmetro "celular" obrigatório.' });

        try {
            const usuario = await NamiBuscarPorCelularModel.buscarPorCelular(celular);
            if (!usuario) return res.status(404).json({ error: 'Nenhum usuário encontrado com esse celular.' });
            res.json({ usuario_id: usuario.usuario_id });
        } catch (error) {
            logger.error(`[Nami] Erro ao buscar por celular=${celular}:`, error);
            res.status(500).json({ error: 'Erro interno.' });
        }
    },

    async toggleNami(req, res) {
        const usuario_id = parseInt(req.params.usuario_id);
        if (!usuario_id) return res.status(400).json({ error: 'usuario_id inválido.' });

        const { ativo } = req.body;
        if (ativo === undefined || (ativo !== 0 && ativo !== 1)) {
            return res.status(400).json({ error: 'Campo "ativo" obrigatório: 0 ou 1.' });
        }

        try {
            const affected = await NamiToggleModel.setAtivo(usuario_id, ativo);
            if (affected === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });

            logger.info(`[Nami] nami_ativo=${ativo} para usuario_id=${usuario_id}`);
            res.json({ success: true, usuario_id, nami_ativo: ativo });
        } catch (error) {
            logger.error(`[Nami] Erro ao fazer toggle usuario_id=${usuario_id}:`, error);
            res.status(500).json({ error: 'Erro interno.' });
        }
    },
};

module.exports = NamiController;
