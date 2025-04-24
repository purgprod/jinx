const AtualizarStatusExecucaoPendenteModel = require('../../models/rotinas/model_manutencao_update_status_execucao_pendente');
const logger = require('../../logger');

const AtualizarStatusExecucaoPendenteController = {
    async atualizarStatusExecucao(req, res) {
        logger.info('Iniciando a atualização do status de execução');

        try {
            const results = await AtualizarStatusExecucaoPendenteModel.atualizarStatusExecucao();
            logger.info(`Resultado do modelo: ${JSON.stringify(results)}`);

            // Verificar se results existe e tem affectedRows
            const affectedRows = results && results.affectedRows ? results.affectedRows : 0;

            logger.info(`Número de registros afetados: ${affectedRows}`);

            return res.status(200).json({
                message: "Rotinas executadas com sucesso",
                afetados: affectedRows
            });
        } catch (error) {
            logger.error('Erro ao atualizar status de execução:', error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            
            return res.status(500).json({
                error: "Erro ao atualizar status de execução",
                message: error.message
            });
        }
    }
};

module.exports = AtualizarStatusExecucaoPendenteController;

