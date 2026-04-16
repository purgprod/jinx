// controllers/objetivos/controller_cancelar_objetivo.js

'use strict';

const logger              = require('../../logger');
const { withTransaction } = require('../../database/transaction');
const ObjetivosLeitura    = require('../../models/objetivos/model_objetivos_leitura');
const ObjetivosEscrita    = require('../../models/objetivos/model_objetivos_escrita');
const MetasEscrita        = require('../../models/objetivos/model_metas_escrita');
const { _atualizarPontosVolateis } = require('../../services/objetivos_service');

const CancelarObjetivoController = {
    /**
     * Cancela um objetivo secundário.
     * O Patrimônio NÃO pode ser cancelado — apenas reconfigurado.
     * DELETE /api/v1/objetivos/:id/:objetivo_id
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

            if (objetivo.is_patrimonio) {
                return res.status(403).json({ error: 'O objetivo Patrimônio não pode ser cancelado.' });
            }

            if (!objetivo.status_ativo) {
                return res.status(409).json({ error: 'Objetivo já está inativo.' });
            }

            await withTransaction(async (conn) => {
                await MetasEscrita.cancelarMetasObjetivo(objetivoId, conn);
                await ObjetivosEscrita.cancelarObjetivo(objetivoId, conn);
                // Recalcular pontos após remoção
                const { _atualizarPontosVolateis: atualizarPV } = require('../../services/objetivos_service');
                // chamada interna sem export — reimplementamos aqui de forma direta
                const ObjetivosLeituraLocal = require('../../models/objetivos/model_objetivos_leitura');
                const MetasLeituraLocal     = require('../../models/objetivos/model_metas_leitura');
                const objetivosRestantes = await ObjetivosLeituraLocal.buscarObjetivosAtivos(usuarioId, conn);
                let pontosVolateis = 0;
                for (const obj of objetivosRestantes) {
                    const metas = await MetasLeituraLocal.buscarMetasAtivas(obj.objetivo_id, 'ASC', conn);
                    for (const meta of metas) {
                        if (Number(meta.objetivo_completo) === 1) continue;
                        const investir = Number(meta.objetivo_investir);
                        if (investir <= 0) continue;
                        const pct = Math.min(Number(meta.saldo_alocado) / investir * 100, 100);
                        pontosVolateis += Math.floor(Number(meta.objetivo_pontos) * pct / 100);
                    }
                }
                await ObjetivosEscrita.atualizarPontosVolateis(usuarioId, pontosVolateis, conn);
            });

            logger.info('[CancelarObjetivo] Objetivo cancelado', { usuarioId, objetivoId });
            return res.status(200).json({ success: true, message: 'Objetivo cancelado com sucesso.' });

        } catch (err) {
            logger.error('[CancelarObjetivo] Erro', { usuarioId, objetivoId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao cancelar objetivo.' });
        }
    },
};

module.exports = CancelarObjetivoController;
