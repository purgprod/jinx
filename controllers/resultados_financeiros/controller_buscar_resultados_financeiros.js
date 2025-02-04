// controllers/resultados_financeiros/controller_buscar_resultados_financeiros.js
const ResultadosFinanceirosBuscarModel = require('../../models/resultados_financeiros/model_buscar_resultados_financeiros');
const logger = require('../../logger');

const ResultadosFinanceirosBuscarController = {
    async getResultados(req, res) {
        logger.info('Consulta iniciada para resultados financeiros');

        try {
            const resultados = await ResultadosFinanceirosBuscarModel.getResultadosFinanceiros();
            logger.info(`Resultados financeiros obtidos: ${JSON.stringify(resultados)}`);
            res.json(resultados);
        } catch (error) {
            logger.error('Erro ao consultar a tabela resultados_financeiros:', error);
            res.status(500).json({ error: 'Erro ao consultar resultados financeiros' });
        }
    }

};

module.exports = ResultadosFinanceirosBuscarController;

