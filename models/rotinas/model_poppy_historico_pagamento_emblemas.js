const pool = require('../../database/database_purg');
const logger = require('../../logger');

const HistoricoPagamentoEmblemasModel = {
    async historicoPagamentoEmblemas(usuario_id, valorEmblemas, conn) {
        try {
            logger.info(`Iniciando o registro histórico do pagamento de emblemas para o usuário ${usuario_id}`);

            usuario_id = parseInt(usuario_id, 10);
            logger.info(`usuario_id processado: ${usuario_id} (${typeof usuario_id})`);

            // Validação dos parâmetros
            if (typeof usuario_id !== 'number' || isNaN(usuario_id)) {
                logger.error(`Usuário inválido: ${usuario_id}`);
                throw new Error('usuario_id deve ser um número válido');
            }

            if (typeof valorEmblemas !== 'number' || isNaN(valorEmblemas)) {
                logger.error(`Histórico de pagamento de emblemas inválida: ${valorEmblemas}`);
                throw new Error('Histórico de pagamento de emblemas deve ser um número válido');
            }

            const sqlQuery = `
                INSERT INTO emblemas
                (usuario_id, pagamento_emblemas)
                VALUES (?, ?)
            `;

            logger.info(`Executando consulta SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da transação: ${usuario_id}, ${valorEmblemas}`);

            const executor = conn || pool.promise();
            const [results] = await executor.execute(sqlQuery, [usuario_id, valorEmblemas]);

            logger.info(`Registro de histórico do pagamento de emblemas concluído com sucesso: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao registrar histórico de pagamento de emblemas para o usuário ${usuario_id}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = HistoricoPagamentoEmblemasModel;

