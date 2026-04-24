const UpdatePorcentagemEmblemasModel = require('../../models/emblemas/model_update_porcentagem_emblemas');
const { withTransaction } = require('../../database/transaction');
const logger = require('../../logger');

const UpdatePorcentagemEmblemasController = {
    async updatePorcentagem(req, res) {
        try {
            const { porcentagem_emblemas, taxa_ir } = req.body;

            if (!porcentagem_emblemas || isNaN(porcentagem_emblemas)) {
                logger.error('Valor da porcentagem não foi informado ou é inválido');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Porcentagem não informada ou inválida'
                });
            }

            if (taxa_ir !== undefined && (isNaN(taxa_ir) || Number(taxa_ir) < 0 || Number(taxa_ir) > 1)) {
                logger.error('Valor da taxa de IR inválido');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Taxa de IR deve ser um número entre 0 e 1 (ex: 0.15 para 15%)'
                });
            }

            await withTransaction(async (conn) => {
                await UpdatePorcentagemEmblemasModel.updatePorcentagemTx(porcentagem_emblemas, conn);
                await UpdatePorcentagemEmblemasModel.updateJurosEMBTx(porcentagem_emblemas, conn);
                if (taxa_ir !== undefined) {
                    await UpdatePorcentagemEmblemasModel.updateTaxaIrTx(taxa_ir, conn);
                }
            });

            logger.info(`Porcentagem de emblemas atualizada para: ${porcentagem_emblemas}${taxa_ir !== undefined ? `, taxa IR: ${taxa_ir}` : ''}`);
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

