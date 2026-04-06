const pool = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarStatusExecucaoPendenteModel = {
    async atualizarStatusExecucao() {
        try {
            logger.info('Iniciando a atualização do status_execucao');

            const sqlQuery = `
                UPDATE rotinas
                SET status_execucao = 'PENDENTE'
                WHERE status_ativo = 1
            `;

            logger.info(`Executando a query: ${sqlQuery}`);

            const [results] = await pool.promise().execute(sqlQuery);

            logger.info(`Atualização concluída com sucesso: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao atualizar o status_execucao:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = AtualizarStatusExecucaoPendenteModel;

