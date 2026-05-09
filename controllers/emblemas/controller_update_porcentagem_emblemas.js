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

            const taxaAnual  = Number(porcentagem_emblemas);
            const aliquotaIr = taxa_ir !== undefined ? Number(taxa_ir) : null;

            // Campos visuais derivados (não afetam o pagamento)
            // juros_a_a líquido = taxa_anual × (1 − IR)
            // rendimento_token  = (taxa_anual / 100 / 365) × 0,01 × (1 − IR)
            // ir (%)            = aliquota × 100
            const aliquotaEfetiva  = aliquotaIr !== null ? aliquotaIr : 0;
            const jurosLiquido     = taxaAnual * (1 - aliquotaEfetiva);
            const rendimentoDiario = (taxaAnual / 100 / 365) * 0.01 * (1 - aliquotaEfetiva);
            const irPercentual     = aliquotaEfetiva * 100;

            await withTransaction(async (conn) => {
                await UpdatePorcentagemEmblemasModel.updatePorcentagemTx(taxaAnual, conn);
                await UpdatePorcentagemEmblemasModel.updateJurosEMBTx(jurosLiquido, conn);
                await UpdatePorcentagemEmblemasModel.updateRendimentoTokenEMBTx(rendimentoDiario, conn);
                await UpdatePorcentagemEmblemasModel.updateIrRFEMBTx(irPercentual, conn);
                if (aliquotaIr !== null) {
                    await UpdatePorcentagemEmblemasModel.updateTaxaIrTx(aliquotaIr, conn);
                }
            });

            logger.info(`Emblemas atualizados — taxa bruta: ${taxaAnual}% a.a. | IR: ${irPercentual}% | juros líquido: ${jurosLiquido.toFixed(4)}% | rendimento/token/dia: ${rendimentoDiario.toFixed(10)}`);
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

