// controllers/projecao/controller_projecao_rendimento.js
'use strict';

const logger = require('../../logger');
const { gerarProjecao } = require('../../services/projecao_service');

const ProjecaoRendimentoController = {
    async getProjecao(req, res) {
        const usuarioId = parseInt(req.params.id, 10);

        if (!usuarioId || usuarioId <= 0) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        try {
            const { rendimento } = await gerarProjecao(usuarioId);
            return res.status(200).json({ projecao: rendimento });
        } catch (error) {
            logger.error(`[PROJECAO] Erro ao gerar projeção de rendimento para usuário ${usuarioId}: ${error.message}`);
            return res.status(500).json({ error: 'Erro ao gerar projeção de rendimento' });
        }
    }
};

module.exports = ProjecaoRendimentoController;
