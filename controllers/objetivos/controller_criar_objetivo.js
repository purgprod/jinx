// controllers/objetivos/controller_criar_objetivo.js
// Cria um novo objetivo secundário (não-Patrimônio) com suas metas.

'use strict';

const { validationResult } = require('express-validator');
const logger               = require('../../logger');
const { withTransaction }  = require('../../database/transaction');
const ObjetivosEscrita     = require('../../models/objetivos/model_objetivos_escrita');
const MetasEscrita         = require('../../models/objetivos/model_metas_escrita');
const { gerarMetas }       = require('../../services/objetivos_service');

const CriarObjetivoController = {
    async execute(req, res) {
        const { id } = req.params;
        const usuarioId = parseInt(id, 10);

        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { descricao, valor_alvo, prazo, pontos_total } = req.body;

        const valorAlvoNum  = Number(valor_alvo);
        const prazoNum      = parseInt(prazo, 10);
        const pontosTotalNum = parseInt(pontos_total, 10);

        if (valorAlvoNum <= 0 || prazoNum <= 0 || prazoNum > 600) {
            return res.status(400).json({ error: 'valor_alvo deve ser > 0 e prazo entre 1 e 600.' });
        }

        logger.info('[CriarObjetivo] Iniciando criação', { usuarioId, descricao, valorAlvoNum, prazoNum });

        try {
            let objetivoId;
            await withTransaction(async (conn) => {
                // Criar cabeçalho do objetivo
                objetivoId = await ObjetivosEscrita.criarObjetivo({
                    usuarioId,
                    descricao:   descricao.trim(),
                    numeroTotal: prazoNum,
                    valorTotal:  valorAlvoNum,
                    pontosTotal: pontosTotalNum,
                    isPatrimonio: false,
                }, conn);

                // Gerar e inserir metas
                const metas = gerarMetas(valorAlvoNum, prazoNum, pontosTotalNum);
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

            logger.info('[CriarObjetivo] Objetivo criado com sucesso', { usuarioId, objetivoId });
            return res.status(201).json({
                success: true,
                message: 'Objetivo criado com sucesso.',
                objetivo_id: objetivoId,
            });

        } catch (err) {
            logger.error('[CriarObjetivo] Erro', { usuarioId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao criar objetivo.' });
        }
    },

    /**
     * Configura (ou reconfigura) as metas do objetivo Patrimônio.
     * Aceita: valor_alvo, prazo, pontos_total — gera metas igualitárias.
     * Pode ser chamado quantas vezes necessário ENQUANTO não houver saldo alocado.
     */
    async configurarPatrimonio(req, res) {
        const { id } = req.params;
        const usuarioId = parseInt(id, 10);

        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { valor_alvo, prazo, pontos_total } = req.body;
        const valorAlvoNum   = Number(valor_alvo);
        const prazoNum       = parseInt(prazo, 10);
        const pontosTotalNum = parseInt(pontos_total, 10);

        if (valorAlvoNum <= 0 || prazoNum <= 0 || prazoNum > 600) {
            return res.status(400).json({ error: 'valor_alvo deve ser > 0 e prazo entre 1 e 600.' });
        }

        const ObjetivosLeitura = require('../../models/objetivos/model_objetivos_leitura');

        try {
            const patrimonio = await ObjetivosLeitura.buscarPatrimonio(usuarioId);
            if (!patrimonio) {
                return res.status(404).json({ error: 'Objetivo Patrimônio não encontrado para este usuário.' });
            }

            // Bloquear reconfiguração se já houver saldo alocado
            if (Number(patrimonio.saldo_alocado_total) > 0) {
                return res.status(409).json({
                    error: 'O Patrimônio já possui saldo alocado. Use a edição (PUT) para recalcular com redistribuição.',
                });
            }

            await withTransaction(async (conn) => {
                // Cancelar metas antigas (se houver)
                await MetasEscrita.cancelarMetasObjetivo(patrimonio.objetivo_id, conn);

                // Atualizar cabeçalho
                await ObjetivosEscrita.editarObjetivo({
                    objetivoId:  patrimonio.objetivo_id,
                    descricao:   'Patrimônio',
                    valorTotal:  valorAlvoNum,
                    numeroTotal: prazoNum,
                    pontosTotal: pontosTotalNum,
                }, conn);

                // Criar novas metas
                const metas = gerarMetas(valorAlvoNum, prazoNum, pontosTotalNum);
                for (const meta of metas) {
                    await MetasEscrita.criarMeta({
                        usuarioId,
                        objetivoId: patrimonio.objetivo_id,
                        numero:     meta.numero,
                        valorInvestir: meta.valorInvestir,
                        pontos:     meta.pontos,
                        dataLimite: meta.dataLimite,
                    }, conn);
                }
            });

            logger.info('[CriarObjetivo] Patrimônio configurado', { usuarioId, valorAlvoNum, prazoNum });
            return res.status(200).json({
                success: true,
                message: 'Patrimônio configurado com sucesso.',
                objetivo_id: patrimonio.objetivo_id,
            });

        } catch (err) {
            logger.error('[CriarObjetivo] Erro ao configurar Patrimônio', { usuarioId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao configurar Patrimônio.' });
        }
    },
};

module.exports = CriarObjetivoController;
