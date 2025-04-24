// models/rotinas/model_mover_pins_sinistro_para_purg.js
const pool = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const MoverPinsSinistroModel = {
    async moverPinsSinistro(tokenId, totalQuantidade, totalRendimento) {
        try {
            logger.info(`Iniciando a movimentação de pins para o token ${tokenId}`);

            const token_Id = parseInt(tokenId, 10);
            logger.info(`token_id processado: ${token_Id} (${typeof token_Id})`);
	    
	    // Validação dos parâmetros
            if (typeof token_Id !== 'number' || isNaN(token_Id)) {
                logger.error(`token_id inválido: ${token_Id}`);
                throw new Error('token_id deve ser um número válido');
            }

            if (typeof totalQuantidade !== 'number' || isNaN(totalQuantidade)) {
                logger.error(`Quantidade inválida: ${totalQuantidade}`);
                throw new Error('Quantidade deve ser um número válido');
            }

            if (typeof totalRendimento !== 'number' || isNaN(totalRendimento)) {
                logger.error(`Rendimento inválido: ${totalRendimento}`);
                throw new Error('Rendimento deve ser um número válido');
            }


            const sqlQuery = `
                UPDATE usuario_tokens 
                SET quantidade_tokens = ?,
                    rendimento_token = ?
                WHERE token_id = ?
                AND usuario_id = 1
            `;

            logger.info(`Executando atualização SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da atualização: ${token_Id}, ${totalQuantidade}, ${totalRendimento}`);

            const [results] = await pool.promise().execute(sqlQuery, [totalQuantidade, totalRendimento, token_Id]);

            logger.info(`Atualização concluída com sucesso: ${JSON.stringify(results)}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao mover os pins para o token ${tokenId}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = MoverPinsSinistroModel;

