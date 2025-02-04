// controllers/resultados_financeiros/controller_resultados_financeiros.js
const ResultadosFinanceirosUpdateModel = require('../../models/resultados_financeiros/model_update_resultados_financeiros');
const logger = require('../../logger');

const ResultadosFinanceirosUpdateController = {
    async updateResultado(req, res) {
        const id = req.params.id;
        const data = req.body;

        try {
            await ResultadosFinanceirosUpdateModel.updateResultadoFinanceiro(id, data);
            res.status(200).json({ message: 'Resultado financeiro atualizado com sucesso' });
        } catch (error) {
            logger.error('Erro ao atualizar o resultado financeiro:', error);
            res.status(500).json({ error: 'Erro ao atualizar o resultado financeiro' });
        }
    }
};

module.exports = ResultadosFinanceirosUpdateController;

