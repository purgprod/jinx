// controllers/assinaturas/controller_buscar_porcentatem_assinaturas.js
const PorcentagemAssinaturasBuscarModel = require('../../models/assinaturas/model_buscar_porcentagem_assinaturas');
const logger = require('../../logger');
console.log('Logger inicializado:', logger); // Deve mostrar o objeto de logger esperado

const PorcentagemAssinaturasBuscarController = {
    async getPorcentagem(req, res) {
        logger.info('Consulta iniciada para porcentagem das assinaturas');

        try {
            const porcentagem = await PorcentagemAssinaturasBuscarModel.getPorcentagem();
            logger.info(`Porcentagem da assiantura obtida: ${JSON.stringify(porcentagem)}`);
            res.json(porcentagem);
        } catch (error) {
            logger.error('Erro ao consultar a tabela de porcentagem de assinaturas:', error);
            res.status(500).json({ error: 'Erro ao consultar porcentagem de assinaturas' });
        }
    }
};

module.exports = PorcentagemAssinaturasBuscarController;

