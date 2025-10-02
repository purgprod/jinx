// models/rotinas/model_poppy_atualizar_pins_para_clientes.js
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarPinsModel = {
    async atualizarPins(id_token, usuario_id, quantidade_tokens_cliente) {
        try {
            logger.info(`Iniciando o atualização de pins para o token ${id_token} e usuário ${usuario_id}`);

            // Validação de id_token e usuario_id
            if (typeof id_token !== 'number' || isNaN(id_token)) {
                logger.error(`id_token inválido: ${id_token}`);
                throw new Error('id_token deve ser um número válido');
            }

            if (typeof usuario_id !== 'number' || isNaN(usuario_id)) {
                logger.error(`usuario_id inválido: ${usuario_id}`);
                throw new Error('usuario_id deve ser um número válido');
            }

            const token_Id = parseInt(id_token, 10);
            const user_Id = parseInt(usuario_id, 10);
            logger.info(`token_id processado: ${token_Id} e usuario_id processado: ${user_Id}`);

            const sqlQuery = `
                UPDATE usuario_tokens 
                SET quantidade_tokens = ?, flag_sinistro = 1
                WHERE token_id = ?
                AND usuario_id = ?
            `;

            logger.info(`Executando atualização SQL: ${sqlQuery}`);
            logger.info(`Parâmetros da atualização: Token ID=${token_Id}, Usuário ID=${user_Id}`);

            const [results] = await pool.promise().execute(sqlQuery, [quantidade_tokens_cliente, token_Id, user_Id]);

            logger.info(`Atualização concluída com sucesso: ${JSON.stringify(results)}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao zerar os pins para o token ${id_token} e usuário ${usuario_id}:`, error);
            logger.error(`Mensagem do erro: ${error.message}`);
            throw error;
        }
    }
};

module.exports = AtualizarPinsModel;

