const pool = require('../../database/database_purg');
const logger = require('../../logger');

const HistoricoPagamentoAssinaturaModel = {
    async historicoPagamentoAssinatura(usuario_id, valorAssinatura) {
        try {
            logger.info(`Iniciando o registro histórico do pagamento da assinatura para o usuário ${usuario_id}`);

            usuario_id = parseInt(usuario_id, 10);
            logger.info(`usuario_id processado: ${usuario_id} (${typeof usuario_id})`);

            // Validação dos parâmetros
            if (typeof usuario_id !== 'number' || isNaN(usuario_id)) {
                logger.error(`Usuário inválido: ${usuario_id}`);
                throw new Error('usuario_id deve ser um número válido');
            }
            
	    if (typeof valorAssinatura !== 'number' || isNaN(valorAssinatura)) {
                logger.error(`Histórico de pagamento da assinatura inválida: ${valorAssinatura}`);
                throw new Error('Histórico de pagamento da assinatura deve ser um número válido');
            }

            const sqlQuery = `
                INSERT INTO assinatura 
                (usuario_id, pagamento_assinatura)
                VALUES (?, ?)
            `;

            logger.info(`Executando consulta SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da transação: ${usuario_id}, ${valorAssinatura}`);

            const [results] = await pool.promise().execute(sqlQuery, [usuario_id, valorAssinatura]);

            logger.info(`Registro de histórico do pagamento da assinatura concluído com sucesso: ${JSON.stringify(results)}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao registrar histórico de pagamento da assinatura para o usuário ${usuario_id}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = HistoricoPagamentoAssinaturaModel;

