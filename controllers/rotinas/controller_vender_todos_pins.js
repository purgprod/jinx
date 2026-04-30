// controllers/rotinas/controller_vender_todos_pins.js
//
// Endpoint de sanitização: vende todos os Pins de todos os clientes,
// devolvendo o valor em saldo (quantidade_tokens * R$ 0,01).

const logger = require('../../logger');
const { executarVendaTodosPins } = require('../../services/vender_todos_pins_service');

const VenderTodosPinsController = {
    async executarVendaTodosPins(req, res) {
        try {
            const resultado = await executarVendaTodosPins();

            if (resultado.total_posicoes === 0) {
                return res.status(200).json({
                    message: 'Nenhuma posição encontrada. Ambiente já está limpo.',
                    ...resultado
                });
            }

            return res.status(200).json({
                message: 'Venda de todos os Pins concluída',
                ...resultado
            });
        } catch (error) {
            logger.error('[VENDA] Erro inesperado na venda de todos os Pins:', error);
            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro inesperado durante a venda dos Pins'
            });
        }
    }
};

module.exports = VenderTodosPinsController;
