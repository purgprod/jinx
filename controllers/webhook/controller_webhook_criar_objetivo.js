'use strict';

const logger              = require('../../logger');
const { withTransaction } = require('../../database/transaction');
const ObjetivosEscrita    = require('../../models/objetivos/model_objetivos_escrita');
const MetasEscrita        = require('../../models/objetivos/model_metas_escrita');
const { gerarMetas }      = require('../../services/objetivos_service');
const NotificacoesModel   = require('../../models/webhook/model_notificacoes');

const WebhookCriarObjetivoController = {
    async execute(req, res) {
        const usuarioId = parseInt(req.params.usuario_id, 10);
        if (!usuarioId || usuarioId <= 0) {
            return res.status(400).json({ error: 'usuario_id inválido.' });
        }

        const { descricao, valor_alvo, prazo, aporte_inicial } = req.body;

        if (!descricao || typeof descricao !== 'string' || descricao.trim().length < 3 || descricao.trim().length > 255) {
            return res.status(400).json({ error: 'descricao obrigatória entre 3 e 255 caracteres.' });
        }
        if (!valor_alvo || isNaN(Number(valor_alvo))) {
            return res.status(400).json({ error: 'valor_alvo obrigatório e deve ser numérico.' });
        }
        if (!prazo || isNaN(parseInt(prazo, 10))) {
            return res.status(400).json({ error: 'prazo obrigatório e deve ser inteiro.' });
        }

        const valorAlvoNum     = Number(valor_alvo);
        const prazoNum         = parseInt(prazo, 10);
        const aporteInicialNum = aporte_inicial ? Number(aporte_inicial) : 0;
        const pontosTotalNum   = (aporteInicialNum > 0 ? prazoNum + 1 : prazoNum) * 40;

        if (valorAlvoNum <= 0 || prazoNum <= 0 || prazoNum > 600) {
            return res.status(400).json({ error: 'valor_alvo deve ser > 0 e prazo entre 1 e 600.' });
        }

        if (aporteInicialNum >= valorAlvoNum) {
            return res.status(400).json({ error: 'aporte_inicial deve ser menor que valor_alvo.' });
        }

        logger.info('[Webhook/CriarObjetivo] Iniciando criação', { usuarioId, descricao, valorAlvoNum, prazoNum });

        try {

            let objetivoId;
            await withTransaction(async (conn) => {
                objetivoId = await ObjetivosEscrita.criarObjetivo({
                    usuarioId,
                    descricao:    descricao.trim(),
                    numeroTotal:  prazoNum,
                    valorTotal:   valorAlvoNum,
                    pontosTotal:  pontosTotalNum,
                    isPatrimonio: false,
                }, conn);

                const metas = gerarMetas(valorAlvoNum, prazoNum, pontosTotalNum, aporteInicialNum);
                for (const meta of metas) {
                    await MetasEscrita.criarMeta({
                        usuarioId,
                        objetivoId,
                        numero:        meta.numero,
                        valorInvestir: meta.valorInvestir,
                        pontos:        meta.pontos,
                        dataLimite:    meta.dataLimite,
                    }, conn);
                }
            });

            logger.info('[Webhook/CriarObjetivo] Objetivo criado com sucesso', { usuarioId, objetivoId });

            setImmediate(async () => {
                try {
                    await NotificacoesModel.criar(usuarioId, 'novo_objetivo', {
                        objetivo_id: objetivoId,
                        descricao:   descricao.trim(),
                        valor_alvo:  valorAlvoNum,
                        prazo:       prazoNum,
                    });
                } catch (err) {
                    logger.error(`[Webhook/Nami] Erro ao criar notificação novo_objetivo usuario_id=${usuarioId}:`, err);
                }
            });

            return res.status(201).json({
                success:     true,
                message:     'Objetivo criado com sucesso.',
                objetivo_id: objetivoId,
            });

        } catch (err) {
            logger.error('[Webhook/CriarObjetivo] Erro', { usuarioId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao criar objetivo.' });
        }
    },
};

module.exports = WebhookCriarObjetivoController;
