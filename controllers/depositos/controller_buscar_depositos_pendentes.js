// controllers/rotinas/controller_buscar_depositos_pendentes.js
const BuscarDepositosModel = require('../../models/depositos/model_buscar_depositos');
const logger = require('../../logger');

const BuscarDepositosPendentesController = {
    async getDepositosPendentes(req, res) {
        logger.info('Buscando todos os depositos pendentes');

        try {
            const depositos = await BuscarDepositosModel.getDepositos();
            logger.info(`Depositos obtidos: ${JSON.stringify(depositos)}`);
            res.json(depositos);
        } catch (error) {
            logger.error('Erro ao consultar a tabela depositos:', error);
            res.status(500).json({ error: 'Erro ao consultar depositos pendentes' });
        }
    }

};

module.exports = BuscarDepositosPendentesController;

