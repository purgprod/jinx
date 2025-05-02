// controllers/rotinas/controller_manutencao_status_execucao_falha.js
const RotinasExecutarModel = require('../../models/rotinas/model_manutencao_status_execucao_falha');
const logger = require('../../logger');

const RotinasExecutarFalhaController = {
    async executarRotina(req, res) {
        const { id } = req.params;

        try {
            await RotinasExecutarModel.executarRotina(id);
            logger.info(`Rotina ${id} executada com falha`);
            res.status(200).json({ message: 'Rotina foi executada com falha' });
        } catch (error) {
            logger.error('Erro ao executar rotina:', error);
            res.status(500).json({ error: 'Erro ao executar rotina' });
        }
    }
};

module.exports = RotinasExecutarFalhaController;

