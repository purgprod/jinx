const UpdatePorcentagemEmblemasModel = require('../../models/emblemas/model_update_porcentagem_emblemas');
const { withTransaction } = require('../../database/transaction');
const logger = require('../../logger');

const UpdatePorcentagemEmblemasController = {
    async updatePorcentagem(req, res) {
        try {
            const { porcentagem_emblemas } = req.body;

            if (!porcentagem_emblemas || isNaN(porcentagem_emblemas)) {
                logger.error('Valor da porcentagem não foi informado ou é inválido');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Porcentagem não informada ou inválida'
                });
            }

            await withTransaction(async (conn) => {
                await UpdatePorcentagemEmblemasModel.updatePorcentagemTx(porcentagem_emblemas, conn);
                await UpdatePorcentagemEmblemasModel.updateJurosEMBTx(porcentagem_emblemas, conn);
            });

            logger.info(`Porcentagem de emblemas e juros_a_a EMB atualizados para: ${porcentagem_emblemas}`);
            return res.status(200).json({
                message: 'Porcentagem atualizada com sucesso'
            });

        } catch (error) {
            logger.error('Erro ao atualizar porcentagem:', error);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erro ao atualizar porcentagem'
            });
        }
    }
};

module.exports = UpdatePorcentagemEmblemasController;

