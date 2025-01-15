// controllers/controller_resultados_financeiros.js
const ResultadosFinanceirosModel = require('../models/model_resultados_financeiros');
const logger = require('../logger'); // Importa o logger

const ResultadosFinanceirosController = {
    async getResultados(req, res) {
        logger.info('Consulta iniciada para resultados financeiros');

        try {
            const resultados = await ResultadosFinanceirosModel.getResultadosFinanceiros();
            logger.info(`Resultados financeiros obtidos: ${JSON.stringify(resultados)}`);
            res.json(resultados); // Retorna os dados como JSON
        } catch (error) {
            logger.error('Erro ao consultar a tabela resultados_financeiros:', error);
            res.status(500).json({ error: 'Erro ao consultar resultados financeiros' });
        }
    }
};

module.exports = ResultadosFinanceirosController;

