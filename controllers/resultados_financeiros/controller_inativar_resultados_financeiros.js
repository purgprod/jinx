// controllers/resultados_financeiros/controller_inativar_resultados_financeiros.js
const ResultadosFinanceirosInativarModel = require('../../models/resultados_financeiros/model_inativar_resultados_financeiros');
const logger = require('../../logger');

const ResultadosFinanceirosInativarController = {
    async inativarResultado(req, res) {
        const id = req.params.id;
        
        try {
            await ResultadosFinanceirosInativarModel.inativarResultado(id);
            res.status(200).json({ message: 'Resultado financeiro inativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao inativar o resultado financeiro:', error);
            res.status(500).json({ error: 'Erro ao inativar o resultado financeiro' });
        }
    }
};

module.exports = ResultadosFinanceirosInativarController;

