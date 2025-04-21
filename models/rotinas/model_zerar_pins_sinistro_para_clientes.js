// models/rotinas/model_zerar_pins_sinistro_para_clientes.js
const pool = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const ZerarPinsSinistroModel = {
    async zerarPinsSinistro(id_token) {
        try {
            logger.info(`Iniciando o zeramento de tokens para o token ${id_token}`);

            // Validação do token_Id
            if (typeof id_token !== 'number' || isNaN(id_token)) {
                logger.error(`Token ID inválido: ${id_token}`);
                throw new Error('Token ID deve ser um número válido');
            }

            const token_Id = parseInt(id_token, 10);
            logger.info(`Token ID processado: ${token_Id} (${typeof token_Id})`);

            const sqlQuery = `
                UPDATE usuario_tokens 
                SET quantidade_tokens = 0,
                    rendimento_token = 0
                WHERE token_id = ?
                AND usuario_id != 1
            `;

            logger.info(`Executando atualização SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da atualização: ${token_Id}`);

            const [results] = await pool.promise().execute(sqlQuery, [token_Id]);

            logger.info(`Atualização concluída com sucesso: ${JSON.stringify(results)}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao zerar os tokens para o token ${id_token}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = ZerarPinsSinistroModel;

