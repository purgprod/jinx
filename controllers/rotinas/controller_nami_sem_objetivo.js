const SemObjetivoModel  = require('../../models/webhook/model_sem_objetivo');
const NotificacoesModel = require('../../models/webhook/model_notificacoes');
const logger            = require('../../logger');

const NamiSemObjetivoController = {
    async executar(_req, res) {
        try {
            const usuarios = await SemObjetivoModel.buscarUsuariosSemObjetivo();

            if (usuarios.length === 0) {
                return res.json({ enfileirados: 0, ignorados: 0, mensagem: 'Nenhum usuário sem objetivo.' });
            }

            let enfileirados = 0;
            let ignorados    = 0;

            for (const usuario of usuarios) {
                const jaNotificado = await SemObjetivoModel.jaFoiNotificadoRecentemente(usuario.usuario_id);
                if (jaNotificado) {
                    ignorados++;
                    continue;
                }
                await NotificacoesModel.criar(usuario.usuario_id, 'sem_objetivo', {
                    apelido: usuario.apelido,
                });
                enfileirados++;
            }

            logger.info(`[Nami] Sem objetivo: ${enfileirados} enfileirados, ${ignorados} já notificados nos últimos 3 dias.`);
            return res.json({ enfileirados, ignorados });

        } catch (error) {
            logger.error('[Nami] Erro ao verificar usuários sem objetivo:', error);
            return res.status(500).json({ error: 'Erro interno ao verificar usuários sem objetivo.' });
        }
    },
};

module.exports = NamiSemObjetivoController;
