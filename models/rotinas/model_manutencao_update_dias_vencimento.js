const connection = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarDiasVencimentoModel = {
    async atualizarDiasVencimento(dias_vencimento, id_token) {
        try {
            logger.info(`Iniciando a atualização do token ${id_token} com ${dias_vencimento} dias de vencimento`);

            const sqlQuery = `
                UPDATE tokens
                SET dias_vencimento = ?
                WHERE id_token = ?
            `;

            logger.info(`Executando a query: ${sqlQuery}`);
            logger.info(`Parâmetros: ${dias_vencimento}, ${id_token}`);

            const [results] = await connection.promise().execute(sqlQuery, [dias_vencimento, id_token]);

            logger.info(`Atualização concluída com sucesso: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao atualizar o token ${id_token}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = AtualizarDiasVencimentoModel;

