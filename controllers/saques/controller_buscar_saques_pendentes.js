// controllers/rotinas/controller_buscar_saques_pendentes.js
const BuscarSaquesModel = require('../../models/saques/model_buscar_saques');
const logger = require('../../logger');

const BuscarSaquesPendentesController = {
    async getSaquesPendentes(req, res) {
        logger.info('Buscando todos os saques pendentes');

        try {
            const saques = await BuscarSaquesModel.getSaques();
            logger.info(`Saques obtidos: ${JSON.stringify(saques)}`);
            res.json(saques);
        } catch (error) {
            logger.error('Erro ao consultar a tabela saques:', error);
            res.status(500).json({ error: 'Erro ao consultar saques pendentes' });
        }
    }

};

module.exports = BuscarSaquesPendentesController;

