// controllers/rotinas/controller_atualizar_ultima_execucao.js
const RotinasAtualizarModel = require('../../models/rotinas/model_atualizar_ultima_execucao');
const logger = require('../../logger');

const RotinasAtualizarController = {
    async atualizarUltimaExecucao(req, res) {
        const { id } = req.params;

        try {
            await RotinasAtualizarModel.atualizarUltimaExecucao(id);
            logger.info(`Ultima execução da rotina ${id} atualizada com sucesso`);
            res.status(200).json({ message: 'Ultima execução atualizada com sucesso' });
        } catch (error) {
            logger.error('Erro ao atualizar ultima execução:', error);
            res.status(500).json({ error: 'Erro ao atualizar ultima execução' });
        }
    }
};

module.exports = RotinasAtualizarController;

