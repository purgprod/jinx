// controllers/objetivos/controller_detalhar_objetivo.js

'use strict';

const logger           = require('../../logger');
const ObjetivosLeitura = require('../../models/objetivos/model_objetivos_leitura');
const MetasLeitura     = require('../../models/objetivos/model_metas_leitura');

const DetalharObjetivoController = {
    /**
     * Retorna um objetivo com todas as suas metas e percentuais de progresso.
     * GET /api/v1/objetivos/:id/:objetivo_id
     */
    async execute(req, res) {
        const usuarioId  = parseInt(req.params.id, 10);
        const objetivoId = parseInt(req.params.objetivo_id, 10);

        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        try {
            const objetivo = await ObjetivosLeitura.buscarObjetivoPorId(usuarioId, objetivoId);
            if (!objetivo) {
                return res.status(404).json({ error: 'Objetivo não encontrado.' });
            }

            const metas = await MetasLeitura.buscarMetasAtivas(objetivoId, 'ASC');

            const metasFormatadas = metas.map(m => {
                const investir    = Number(m.objetivo_investir);
                const alocado     = Number(m.saldo_alocado);
                const percentual  = investir > 0 ? Math.min(alocado / investir * 100, 100) : 0;
                return {
                    id:                m.id,
                    numero:            m.objetivo_numero,
                    valor_alvo:        investir,
                    saldo_alocado:     alocado,
                    percentual:        Math.round(percentual * 100) / 100,
                    pontos:            m.objetivo_pontos,
                    completo:          Boolean(m.objetivo_completo),
                };
            });

            const totalMetas     = metas.length;
            const metasCompletas = metas.filter(m => Number(m.objetivo_completo) === 1).length;
            const percentualGeral = totalMetas > 0
                ? Math.round(metasFormatadas.reduce((a, m) => a + m.percentual, 0) / totalMetas)
                : 0;

            return res.status(200).json({
                success: true,
                objetivo: {
                    objetivo_id:         objetivo.objetivo_id,
                    descricao:           objetivo.objetivo_descricao,
                    is_patrimonio:       Boolean(objetivo.is_patrimonio),
                    valor_alvo:          Number(objetivo.objetivo_valor_total),
                    prazo_total:         objetivo.objetivo_numero_total,
                    pontos_total:        objetivo.objetivo_pontos_total,
                    saldo_alocado_total: Number(objetivo.saldo_alocado_total),
                    metas_total:         totalMetas,
                    metas_completas:     metasCompletas,
                    percentual_geral:    percentualGeral,
                    objetivo_completo:   Boolean(objetivo.objetivo_completo),
                    primeiro_aporte_feito: Boolean(objetivo.primeiro_aporte_feito),
                },
                metas: metasFormatadas,
            });

        } catch (err) {
            logger.error('[DetalharObjetivo] Erro', { usuarioId, objetivoId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao detalhar objetivo.' });
        }
    },
};

module.exports = DetalharObjetivoController;
