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

        const { descricao, valor_alvo, prazo, aporte_inicial } = req.body;

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

        const { valor_alvo, prazo } = req.body;
        const valorAlvoNum   = Number(valor_alvo);
        const prazoNum       = parseInt(prazo, 10);
        const pontosTotalNum = prazoNum * 40;

        if (valorAlvoNum <= 0 || prazoNum <= 0 || prazoNum > 600) {
            return res.status(400).json({ error: 'valor_alvo deve ser > 0 e prazo entre 1 e 600.' });
        }

        const ObjetivosLeitura = require('../../models/objetivos/model_objetivos_leitura');

        try {
            const patrimonio = await ObjetivosLeitura.buscarPatrimonio(usuarioId);

            // Bloquear reconfiguração se já houver saldo alocado
            if (patrimonio && Number(patrimonio.saldo_alocado_total) > 0) {
                return res.status(409).json({
                    error: 'O Patrimônio já possui saldo alocado. Use a edição (PUT) para recalcular com redistribuição.',
                });
            }

            let objetivoId;
            await withTransaction(async (conn) => {
                if (patrimonio) {
                    // Cancelar metas antigas (se houver) e atualizar cabeçalho
                    objetivoId = patrimonio.objetivo_id;
                    await MetasEscrita.cancelarMetasObjetivo(objetivoId, conn);
                    await ObjetivosEscrita.editarObjetivo({
                        objetivoId,
                        descricao:   'Patrimônio',
                        valorTotal:  valorAlvoNum,
                        numeroTotal: prazoNum,
                        pontosTotal: pontosTotalNum,
                    }, conn);
                } else {
                    // Primeira configuração — cria o registro do Patrimônio
                    objetivoId = await ObjetivosEscrita.criarObjetivo({
                        usuarioId,
                        descricao:    'Patrimônio',
                        numeroTotal:  prazoNum,
                        valorTotal:   valorAlvoNum,
                        pontosTotal:  pontosTotalNum,
                        isPatrimonio: true,
                    }, conn);
                }

                // Criar novas metas
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

            logger.info('[CriarObjetivo] Patrimônio configurado', { usuarioId, objetivoId, valorAlvoNum, prazoNum });
            return res.status(200).json({
                success: true,
                message: 'Patrimônio configurado com sucesso.',
                objetivo_id: objetivoId,
            });

        } catch (err) {
            logger.error('[CriarObjetivo] Erro ao configurar Patrimônio', { usuarioId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao configurar Patrimônio.' });
        }
    },
};

module.exports = CriarObjetivoController;
