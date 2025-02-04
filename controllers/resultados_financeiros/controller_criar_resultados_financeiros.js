// controllers/resultados_financeiros/controller_criar_resultados_financeiros.js
const ResultadosFinanceirosCriarModel = require('../../models/resultados_financeiros/model_criar_resultados_financeiros');
const logger = require('../../logger');

const ResultadosFinanceirosCriarController = {
    async createResultado(req, res) {
        const data = req.body;

        try {
            await ResultadosFinanceirosCriarModel.createResultadoFinanceiro(data);
            res.status(201).json({ message: 'Resultado financeiro criado com sucesso' });
        } catch (error) {
            logger.error('Erro ao criar o resultado financeiro:', error);
            res.status(500).json({ error: 'Erro ao criar o resultado financeiro' });
        }
    }
};

module.exports = ResultadosFinanceirosCriarController;

