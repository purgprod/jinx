// models/rotinas/model_poppy_atualizar_carteiras.js
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarCarteiraUsuarioModel = {
    async atualizarCarteiraUsuario(usuario_id, novo_saldo, conn) {
        try {
            const data_atual = new Date();
            logger.info(`Iniciando o registro da transação de pins para o usuário ${usuario_id}`);

            const sqlQuery = `
                UPDATE carteiras
                SET saldo = ?,
                    ultima_alteracao = ?
                WHERE usuario_id = ?
            ;`;

            logger.info(`Executando consulta SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da transação: ${novo_saldo}, ${data_atual.toISOString()}, ${usuario_id}`);

            const executor = conn || pool.promise();
            const [results] = await executor.execute(sqlQuery, [novo_saldo, data_atual, usuario_id]);

            logger.info(`Saldo da carteira atualizado com sucesso: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
            logger.info(`Número de carteiras afetadas: ${results.affectedRows}`);
            logger.info(`Data da última alteração: ${data_atual.toISOString()}`);

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

