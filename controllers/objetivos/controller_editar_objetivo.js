// controllers/objetivos/controller_editar_objetivo.js
// Edita descrição, valor_alvo ou prazo de um objetivo.
// Mudanças em valor_alvo ou prazo disparam o recalculation_job.

'use strict';

const { validationResult }        = require('express-validator');
const logger                       = require('../../logger');
const { withTransaction }          = require('../../database/transaction');
const ObjetivosLeitura             = require('../../models/objetivos/model_objetivos_leitura');
const { recalcularMetasObjetivo }  = require('../../services/objetivos_service');

const EditarObjetivoController = {
    async execute(req, res) {
        const usuarioId  = parseInt(req.params.id, 10);
        const objetivoId = parseInt(req.params.objetivo_id, 10);

        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const objetivo = await ObjetivosLeitura.buscarObjetivoPorId(usuarioId, objetivoId);
            if (!objetivo) {
                return res.status(404).json({ error: 'Objetivo não encontrado.' });
            }

            if (!objetivo.status_ativo) {
                return res.status(409).json({ error: 'Objetivo inativo não pode ser editado.' });
            }

            const { descricao, valor_alvo, prazo, pontos_total } = req.body;

            const novoValorAlvo   = valor_alvo   !== undefined ? Number(valor_alvo)       : Number(objetivo.objetivo_valor_total);
            const novoPrazo       = prazo         !== undefined ? parseInt(prazo, 10)      : objetivo.objetivo_numero_total;
            const novosPontos     = pontos_total  !== undefined ? parseInt(pontos_total, 10) : objetivo.objetivo_pontos_total;
            const novaDescricao   = descricao     !== undefined ? descricao.trim()         : objetivo.objetivo_descricao;

            if (novoValorAlvo <= 0 || novoPrazo <= 0 || novoPrazo > 600) {
                return res.status(400).json({ error: 'valor_alvo deve ser > 0 e prazo entre 1 e 600.' });
            }

            const saldoAtual = Number(objetivo.saldo_alocado_total ?? 0);

            // Quando há saldo investido, o controller pode validar rapidamente.
            // Quando saldo = 0, a baseline é a primeira meta (aporte), que só o
            // serviço conhece — a validação fina acontece lá e sobe como validationError.
            if (saldoAtual > 0) {
                if (novoValorAlvo <= saldoAtual) {
                    return res.status(400).json({
                        error: `O valor alvo deve ser maior que o total já investido (R$ ${saldoAtual.toFixed(2)}).`,
                    });
                }
                const parcelaBruta = (novoValorAlvo - saldoAtual) / novoPrazo;
                if (parcelaBruta < 5) {
                    return res.status(400).json({
                        error: `A parcela mínima é de R$ 5,00. Com ${novoPrazo} meses restantes, cada parcela seria R$ ${parcelaBruta.toFixed(2)}.`,
                    });
                }
            }

            const mudouValor = novoValorAlvo !== Number(objetivo.objetivo_valor_total);
            const mudouPrazo = novoPrazo     !== objetivo.objetivo_numero_total;

            const motivo = mudouValor ? 'alteracao_alvo' : mudouPrazo ? 'alteracao_prazo' : null;

            await withTransaction(async (conn) => {
                if (motivo) {
                    // Recalcula metas e redistribui saldo existente
                    await recalcularMetasObjetivo(
                        conn, usuarioId, objetivo,
                        novoValorAlvo, novoPrazo, novosPontos,
                        motivo
                    );
                } else {
                    // Apenas atualiza a descrição (sem recálculo)
                    const ObjetivosEscrita = require('../../models/objetivos/model_objetivos_escrita');
                    await ObjetivosEscrita.editarObjetivo({
                        objetivoId,
                        descricao:   novaDescricao,
                        valorTotal:  novoValorAlvo,
                        numeroTotal: novoPrazo,
                        pontosTotal: novosPontos,
                    }, conn);
                }
            });

            logger.info('[EditarObjetivo] Objetivo atualizado', { usuarioId, objetivoId, motivo });
            return res.status(200).json({
                success: true,
                message: motivo
                    ? `Objetivo atualizado e metas recalculadas (${motivo}).`
                    : 'Objetivo atualizado.',
                recalculo: Boolean(motivo),
            });

        } catch (err) {
            if (err.validationError) {
                return res.status(400).json({ error: err.message });
            }
            logger.error('[EditarObjetivo] Erro', { usuarioId, objetivoId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao editar objetivo.' });
        }
    },
};

module.exports = EditarObjetivoController;
