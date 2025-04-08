// controllers/rotinas/controller_executar_rotina.js
const RotinasExecutarModel = require('../../models/rotinas/model_executar_rotina');
const logger = require('../../logger');

const RotinasExecutarController = {
    async executarRotina(req, res) {
        const { id } = req.params;

        try {
            await RotinasExecutarModel.executarRotina(id);
            logger.info(`Rotina ${id} executada com sucesso`);
            res.status(200).json({ message: 'Rotina executada com sucesso' });
        } catch (error) {
            logger.error('Erro ao executar rotina:', error);
            res.status(500).json({ error: 'Erro ao executar rotina' });
        }
    }
};

module.exports = RotinasExecutarController;

