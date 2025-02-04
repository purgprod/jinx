// controllers/resultados_financeiros/controller_ativar_resultados_financeiros.js
const ResultadosFinanceirosAtivarModel = require('../../models/resultados_financeiros/model_ativar_resultados_financeiros');
const logger = require('../../logger');

const ResultadosFinanceirosAtivarController = {
    async ativarResultado(req, res) {
        const id = req.params.id;
        
        try {
            await ResultadosFinanceirosAtivarModel.ativarResultado(id);
            res.status(200).json({ message: 'Resultado financeiro ativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao ativar o resultado financeiro:', error);
            res.status(500).json({ error: 'Erro ao ativar o resultado financeiro' });
        }
    }
};

module.exports = ResultadosFinanceirosAtivarController;

