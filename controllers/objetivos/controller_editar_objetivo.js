// controllers/objetivos/controller_editar_objetivo.js
// Edita descrição, prazo ou valor_alvo (somente para cima) de um objetivo.
// Mudanças em valor_alvo ou prazo disparam o recalculation_job.

'use strict';

const { validationResult }        = require('express-validator');
const logger                       = require('../../logger');
const { withTransaction }          = require('../../database/transaction');
const ObjetivosLeitura             = require('../../models/objetivos/model_objetivos_leitura');
const { recalcularMetasObjetivo }  = require('../../services/objetivos_service');
const BuscarDepositoPorTxidModel   = require('../../models/depositos/model_deposito_buscar_por_txid');

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

            const { descricao, prazo, valor_alvo } = req.body;

            const valorAtual    = Number(objetivo.objetivo_valor_total);
            const novoValorAlvo = valor_alvo !== undefined ? Number(valor_alvo) : valorAtual;
            const novoPrazo     = prazo      !== undefined ? parseInt(prazo, 10) : objetivo.objetivo_numero_total;
            const novaDescricao = descricao  !== undefined ? descricao.trim()    : objetivo.objetivo_descricao;

            if (novoValorAlvo < valorAtual) {
                return res.status(400).json({ error: 'O valor alvo não pode ser reduzido.' });
            }

            if (novoPrazo <= 0 || novoPrazo > 600) {
                return res.status(400).json({ error: 'Prazo deve ser entre 1 e 600 meses.' });
            }

            const saldoAtual = Number(objetivo.saldo_alocado_total ?? 0);
            const mudouPrazo = novoPrazo     !== objetivo.objetivo_numero_total;
            const mudouValor = novoValorAlvo !== valorAtual;
            const motivo     = mudouValor ? 'alteracao_valor' : mudouPrazo ? 'alteracao_prazo' : null;

            // Quando só o prazo muda, valida parcela antes de entrar na transação.
            // Quando o valor muda, o service recalcularMetasObjetivo faz essa validação.
            if (!mudouValor && saldoAtual > 0) {
                const parcelaBruta = (novoValorAlvo - saldoAtual) / novoPrazo;
                if (parcelaBruta < 5) {
                    return res.status(400).json({
                        error: `A parcela mínima é de R$ 5,00. Com ${novoPrazo} meses restantes, cada parcela seria R$ ${parcelaBruta.toFixed(2)}.`,
                    });
                }
            }

            if (motivo) {
                const depositoRecente = await BuscarDepositoPorTxidModel.temDepositoRecenteExecutado(usuarioId);
                if (depositoRecente) {
                    return res.status(409).json({
                        error: 'Aguarde 10 minutos após um depósito antes de editar seus objetivos.',
                    });
                }
            }

            await withTransaction(async (conn) => {
                if (motivo) {
                    // Recalcula metas redistribuindo saldo e pontos proporcionalmente
                    await recalcularMetasObjetivo(
                        conn, usuarioId, objetivo,
                        novoValorAlvo, novoPrazo, Number(objetivo.objetivo_pontos_total),
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
                        pontosTotal: Number(objetivo.objetivo_pontos_total),
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
