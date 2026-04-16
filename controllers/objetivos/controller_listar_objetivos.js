// controllers/objetivos/controller_listar_objetivos.js

'use strict';

const logger           = require('../../logger');
const ObjetivosLeitura = require('../../models/objetivos/model_objetivos_leitura');
const MetasLeitura     = require('../../models/objetivos/model_metas_leitura');

const ListarObjetivosController = {
    /**
     * Retorna todos os objetivos ativos do usuário com resumo de progresso.
     * GET /api/v1/objetivos/:id
     */
    async execute(req, res) {
        const { id } = req.params;
        const usuarioId = parseInt(id, 10);

        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        try {
            const objetivos = await ObjetivosLeitura.buscarObjetivosAtivos(usuarioId);
            const pontos    = await ObjetivosLeitura.buscarPontosCarteira(usuarioId);

            const resultado = await Promise.all(objetivos.map(async (obj) => {
                const metas = await MetasLeitura.buscarMetasAtivas(obj.objetivo_id, 'ASC');
                const totalMetas = metas.length;
                const metasCompletas = metas.filter(m => Number(m.objetivo_completo) === 1).length;

                const percentualGeral = totalMetas > 0
                    ? Math.min(Math.round(
                        metas.reduce((acc, m) => {
                            const p = Number(m.objetivo_investir) > 0
                                ? Math.min(Number(m.saldo_alocado) / Number(m.objetivo_investir) * 100, 100)
                                : 0;
                            return acc + p;
                        }, 0) / totalMetas
                      ), 100)
                    : 0;

                return {
                    objetivo_id:         obj.objetivo_id,
                    descricao:           obj.objetivo_descricao,
                    is_patrimonio:       Boolean(obj.is_patrimonio),
                    valor_alvo:          Number(obj.objetivo_valor_total),
                    prazo_total:         obj.objetivo_numero_total,
                    pontos_total:        obj.objetivo_pontos_total,
                    saldo_alocado_total: Number(obj.saldo_alocado_total),
                    metas_total:         totalMetas,
                    metas_completas:     metasCompletas,
                    percentual_geral:    percentualGeral,
                    objetivo_completo:   Boolean(obj.objetivo_completo),
                    status_ativo:        Boolean(obj.status_ativo),
                };
            }));

            return res.status(200).json({
                success: true,
                objetivos: resultado,
                pontos: {
                    total:       pontos?.pontos          ?? 0,
                    permanentes: pontos?.pontos_permanentes ?? 0,
                    volateis:    pontos?.pontos_volateis   ?? 0,
                },
            });

        } catch (err) {
            logger.error('[ListarObjetivos] Erro', { usuarioId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao listar objetivos.' });
        }
    },
};

module.exports = ListarObjetivosController;
