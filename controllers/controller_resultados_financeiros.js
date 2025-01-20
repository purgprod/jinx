// controllers/controller_resultados_financeiros.js
const ResultadosFinanceirosModel = require('../models/model_resultados_financeiros');
const logger = require('../logger');

const ResultadosFinanceirosController = {
    async getResultados(req, res) {
        logger.info('Consulta iniciada para resultados financeiros');

        try {
            const resultados = await ResultadosFinanceirosModel.getResultadosFinanceiros();
            logger.info(`Resultados financeiros obtidos: ${JSON.stringify(resultados)}`);
            res.json(resultados);
        } catch (error) {
            logger.error('Erro ao consultar a tabela resultados_financeiros:', error);
            res.status(500).json({ error: 'Erro ao consultar resultados financeiros' });
        }
    },

    async updateResultado(req, res) {
        const id = req.params.id;
        const data = req.body;

        try {
            await ResultadosFinanceirosModel.updateResultadoFinanceiro(id, data);
            res.status(200).json({ message: 'Dados atualizados com sucesso' });
        } catch (error) {
            logger.error('Erro ao atualizar o resultado financeiro:', error);
            res.status(500).json({ error: 'Erro ao atualizar o resultado financeiro' });
        }
    },

    async createResultado(req, res) {
        const data = req.body;

        try {
            await ResultadosFinanceirosModel.createResultadoFinanceiro(data);
            res.status(201).json({ message: 'Resultado financeiro criado com sucesso' });
        } catch (error) {
            logger.error('Erro ao criar o resultado financeiro:', error);
            res.status(500).json({ error: 'Erro ao criar o resultado financeiro' });
        }
    },

    async inativarResultado(req, res) {
        const id = req.params.id;
        
        try {
            await ResultadosFinanceirosModel.inativarResultado(id);
            res.status(200).json({ message: 'Resultado financeiro inativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao inativar o resultado financeiro:', error);
            res.status(500).json({ error: 'Erro ao inativar o resultado financeiro' });
        }
    },

    async ativarResultado(req, res) {
        const id = req.params.id;
        
        try {
            await ResultadosFinanceirosModel.ativarResultado(id);
            res.status(200).json({ message: 'Resultado financeiro ativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao ativar o resultado financeiro:', error);
            res.status(500).json({ error: 'Erro ao ativar o resultado financeiro' });
        }
    }
};

module.exports = ResultadosFinanceirosController;

