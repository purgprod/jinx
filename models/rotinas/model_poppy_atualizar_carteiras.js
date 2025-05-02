const pool = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const AtualizarCarteiraUsuarioModel = {
    async atualizarCarteiraUsuario(usuario_id, novoSaldo) {
        try {
            const dataAtual = new Date();
            logger.info(`Iniciando o registro da transação de pins para o usuário ${usuario_id}`);

            // Converte os parâmetros para números, se necessário
            usuario_id = parseInt(usuario_id, 10);
            logger.info(`usuario_id processado: ${usuario_id} (${typeof usuario_id})`);

            // Validação dos parâmetros
            if (typeof usuario_id !== 'number' || isNaN(usuario_id)) {
                logger.error(`Usuário inválido: ${usuario_id}`);
                throw new Error('usuario_id deve ser um número válido');
            }

            if (typeof novoSaldo !== 'number' || isNaN(novoSaldo)) {
                logger.error(`Valor de Transação inválido: ${novoSaldo}`);
                throw new Error('Valor de Transação deve ser um número válido');
            }

            const sqlQuery = `
                UPDATE carteiras 
                SET saldo = ?,
                    ultima_alteracao = ?
                WHERE usuario_id = ?
            ;`;

            logger.info(`Executando consulta SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da transação: ${novoSaldo}, ${dataAtual.toISOString()}, ${usuario_id}`);

            const [results] = await pool.promise().execute(sqlQuery, [novoSaldo, dataAtual, usuario_id]);

            logger.info(`Saldo da carteira atualizado com sucesso: ${JSON.stringify(results)}`);
            logger.info(`Número de carteiras afetadas: ${results.affectedRows}`);
            logger.info(`Data da última alteração: ${dataAtual.toISOString()}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao atualizar a carteira para o usuário ${usuario_id}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = AtualizarCarteiraUsuarioModel;

