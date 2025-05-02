const pool = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const TransacoesPinsModel = {
    async transacoesPins(usuario_id, tokenId, totalQuantidade, totalTransacao) {
        try {
            logger.info(`Iniciando o registro da transação de pins para o usuário ${usuario_id}`);

            // Converte os parâmetros para números, se necessário
            const id_token = parseInt(tokenId, 10);
            logger.info(`id_token processado: ${id_token} (${typeof id_token})`);

            usuario_id = parseInt(usuario_id, 10);
            logger.info(`usuario_id processado: ${usuario_id} (${typeof usuario_id})`);

            // Validação dos parâmetros
            if (typeof usuario_id !== 'number' || isNaN(usuario_id)) {
                logger.error(`Usuário inválido: ${usuario_id}`);
                throw new Error('usuario_id deve ser um número válido');
            }

            if (typeof id_token !== 'number' || isNaN(id_token)) {
                logger.error(`id_token inválido: ${id_token}`);
                throw new Error('id_token deve ser um número válido');
            }

            if (typeof totalQuantidade !== 'number' || isNaN(totalQuantidade)) {
                logger.error(`Quantidade inválida: ${totalQuantidade}`);
                throw new Error('Quantidade deve ser um número válido');
            }

            if (typeof totalTransacao !== 'number' || isNaN(totalTransacao)) {
                logger.error(`Valor de Transação inválido: ${totalTransacao}`);
                throw new Error('Valor de Transação deve ser um número válido');
            }

            const sqlQuery = `
                INSERT INTO transacoes 
                (usuario_id, id_token, quantidade_token, valor_transacao, tipo_transacao)
                VALUES (?, ?, ?, ?, 'V')
            `;

            logger.info(`Executando consulta SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da transação: ${usuario_id}, ${id_token}, ${totalQuantidade}, ${totalTransacao}`);

            const [results] = await pool.promise().execute(sqlQuery, [usuario_id, id_token, totalQuantidade, totalTransacao]);

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

