// controllers/emblemas/controller_buscar_porcentagem_emblemas.js
const PorcentagemEmblemasBuscarModel = require('../../models/emblemas/model_buscar_porcentagem_emblemas');
const logger = require('../../logger');
console.log('Logger inicializado:', logger); // Deve mostrar o objeto de logger esperado

const PorcentagemEmblemasBuscarController = {
    async getPorcentagem(req, res) {
        logger.info('Consulta iniciada para porcentagem dos emblemas');

        try {
            const porcentagem = await PorcentagemEmblemasBuscarModel.getPorcentagem();
            logger.info(`Porcentagem pago em emblemas obtida: ${JSON.stringify(porcentagem)}`);
            res.json(porcentagem);
        } catch (error) {
            logger.error('Erro ao consultar a tabela de porcentagem de emblemas:', error);
            res.status(500).json({ error: 'Erro ao consultar porcentagem de emblemas' });
        }
    }
};

module.exports = PorcentagemEmblemasBuscarController;

