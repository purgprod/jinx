const pool = require('../../database/database_purg');
const logger = require('../../logger');

const TransacoesPinsModel = {
    async transacoesPins(usuario_id, token_id, quantidade_tokens_cliente, tokens_transacao_cliente) {
        try {
            logger.info(`Iniciando o registro da transação de pins para o usuário ${usuario_id}`);

            const sqlQuery = `
                INSERT INTO transacoes 
                (usuario_id, id_token, quantidade_token, valor_transacao, tipo_transacao)
                VALUES (?, ?, ?, ?, 'V')
            `;

            logger.info(`Executando consulta SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da transação: ${usuario_id}, ${token_id}, ${quantidade_tokens_cliente}, ${tokens_transacao_cliente}`);

            const [results] = await pool.promise().execute(sqlQuery, [usuario_id, token_id, quantidade_tokens_cliente, tokens_transacao_cliente]);

            logger.info(`Registro de transação concluído com sucesso: ${JSON.stringify(results)}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao registrar transação para o usuário ${usuario_id}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = TransacoesPinsModel;

