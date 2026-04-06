const pool = require('../../database/database_purg');
const logger = require('../../logger');

const RendimentosPinsModel = {
    async rendimentosPins(usuario_id, rendimentoTotal) {
        try {
            logger.info(`Iniciando o registro dos rendimentos para o usuário ${usuario_id}`);

            usuario_id = parseInt(usuario_id, 10);
            logger.info(`usuario_id processado: ${usuario_id} (${typeof usuario_id})`);

            // Validação dos parâmetros
            if (typeof usuario_id !== 'number' || isNaN(usuario_id)) {
                logger.error(`Usuário inválido: ${usuario_id}`);
                throw new Error('usuario_id deve ser um número válido');
            }
            
	    if (typeof rendimentoTotal !== 'number' || isNaN(rendimentoTotal)) {
                logger.error(`Rendimento inválido: ${rendimentoTotal}`);
                throw new Error('Rendimento deve ser um número válido');
            }

            const sqlQuery = `
                INSERT INTO rendimentos 
                (usuario_id, rendimento_diario)
                VALUES (?, ?)
            `;

            logger.info(`Executando consulta SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da transação: ${usuario_id}, ${rendimentoTotal}`);

            const [results] = await pool.promise().execute(sqlQuery, [usuario_id, rendimentoTotal]);

            logger.info(`Registro de rendimento histórico concluído com sucesso: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao registrar rendimento histórico para o usuário ${usuario_id}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = RendimentosPinsModel;

