// controllers/usuarios/controller_objetivos_usuarios.js
// Leitura de objetivos e metas de um usuário para o painel admin (sem verificação de ownership).

'use strict';

const logger           = require('../../logger');
const ObjetivosLeitura = require('../../models/objetivos/model_objetivos_leitura');
const MetasLeitura     = require('../../models/objetivos/model_metas_leitura');

const ObjetivosUsuariosController = {
    async getObjetivos(req, res) {
        const usuarioId = parseInt(req.params.id, 10);

        try {
            const objetivos = await ObjetivosLeitura.buscarObjetivosAtivos(usuarioId);

            const resultado = await Promise.all(objetivos.map(async (obj) => {
                const metas = await MetasLeitura.buscarMetasAtivas(obj.objetivo_id, 'ASC');

                return {
                    objetivo_id:         obj.objetivo_id,
                    descricao:           obj.objetivo_descricao,
                    is_patrimonio:       Boolean(obj.is_patrimonio),
                    valor_alvo:          Number(obj.objetivo_valor_total),
                    saldo_alocado_total: Number(obj.saldo_alocado_total),
                    objetivo_completo:   Boolean(obj.objetivo_completo),
                    metas: metas.map(m => ({
                        id:          m.id,
                        numero:      m.objetivo_numero,
                        data_limite: m.data_limite,
                        meta:        Number(m.objetivo_investir),
                        aporte:      Number(m.saldo_alocado),
                        completo:    Boolean(m.objetivo_completo),
                    })),
                };
            }));

            return res.status(200).json({ success: true, objetivos: resultado });

        } catch (err) {
            logger.error('[ObjetivosUsuarios] Erro ao buscar objetivos', { usuarioId, erro: err.message });
            return res.status(500).json({ error: 'Erro interno ao buscar objetivos.' });
        }
    },
};

module.exports = ObjetivosUsuariosController;
