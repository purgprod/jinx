// controllers/rotinas/controller_buscar_rotinas.js
const RotinasBuscarModel = require('../../models/rotinas/model_buscar_rotinas');
const logger = require('../../logger');
console.log('Logger inicializado:', logger); // Deve mostrar o objeto de logger esperado

const RotinasBuscarController = {
    async getRotinas(req, res) {
        logger.info('Consulta iniciada para rotinas');

        try {
            const rotinas = await RotinasBuscarModel.getRotinas();
            logger.info(`Rotinas obtidos: ${JSON.stringify(rotinas)}`);
            res.json(rotinas);
        } catch (error) {
            logger.error('Erro ao consultar a tabela rotinas:', error);
            res.status(500).json({ error: 'Erro ao consultar rotinas' });
        }
    }

};

module.exports = RotinasBuscarController;

