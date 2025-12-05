// models/rotinas/model_mover_pins.js
const pool   = require('../../database/database_purg');
const logger = require('../../logger');

const MoverPinsModel = {
    /**
     * Move (atualiza) a quantidade de pins de um token para o usuário-sistema (id = 1).
     *
     * @param {number|string} tokenId          ID do token a ser atualizado.
     * @param {number}        totalQuantidade  Nova quantidade de pins.
     * @returns {Promise<object>} Resultado da execução do UPDATE.
     */
    async moverPins(tokenId, totalQuantidade) {
        try {
            logger.info(`Iniciando a movimentação de pins para o token ${tokenId}`);

            const token_Id = parseInt(tokenId, 10);
            logger.info(`token_id processado: ${token_Id} (${typeof token_Id})`);

            // Validação dos parâmetros --------------------------
            if (typeof token_Id !== 'number' || isNaN(token_Id)) {
                logger.error(`token_id inválido: ${token_Id}`);
                throw new Error('token_id deve ser um número válido');
            }

            if (typeof totalQuantidade !== 'number' || isNaN(totalQuantidade)) {
                logger.error(`Quantidade inválida: ${totalQuantidade}`);
                throw new Error('Quantidade deve ser um número válido');
            }

            // Query de atualização ------------------------------
            const sqlQuery = `
                UPDATE usuario_tokens
                   SET quantidade_tokens = ?
                 WHERE token_id   = ?
                   AND usuario_id = 1
            `;

            logger.info(`Executando atualização SQL: ${sqlQuery.trim()}`);
            logger.info(`Parâmetros: quantidade_tokens=${totalQuantidade}, token_id=${token_Id}`);

            const [results] = await pool.promise().execute(sqlQuery, [
                totalQuantidade,
                token_Id
            ]);

            logger.info(`Atualização concluída com sucesso: ${JSON.stringify(results)}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao mover pins para o token ${tokenId}:`, error);
            logger.error(`Mensagem: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    },

    /**
     * Atualiza a quantidade de tokens de um usuário específico.
     *
     * @param {number|string} tokenId       ID do token a ser atualizado.
     * @param {number|string} usuarioId     ID do usuário a ter os tokens atualizados.
     * @param {number}        novaQuantidade Nova quantidade de tokens.
     * @returns {Promise<object>} Resultado da execução do UPDATE.
     */
    async removerPinsUsuario(tokenId, usuarioId, novaQuantidade) {
        try {
            const token_Id   = parseInt(tokenId, 10);
            const usuario_Id = parseInt(usuarioId, 10);

            logger.info(`Iniciando remoção de pins para token ${token_Id} e usuário ${usuario_Id}`);

            // Validação dos parâmetros --------------------------
            if (typeof token_Id !== 'number' || isNaN(token_Id)) {
                logger.error(`token_id inválido: ${tokenId}`);
                throw new Error('token_id deve ser um número válido');
            }

            if (typeof usuario_Id !== 'number' || isNaN(usuario_Id)) {
                logger.error(`usuario_id inválido: ${usuarioId}`);
                throw new Error('usuario_id deve ser um número válido');
            }

            if (typeof novaQuantidade !== 'number' || isNaN(novaQuantidade)) {
                logger.error(`Quantidade inválida: ${novaQuantidade}`);
                throw new Error('Quantidade deve ser um número válido');
            }

            // Query de atualização ------------------------------
            const sqlQuery = `
                UPDATE usuario_tokens
                   SET quantidade_tokens = ?
                 WHERE token_id   = ?
                   AND usuario_id = ?
            `;

            logger.info(`Executando atualização SQL: ${sqlQuery.trim()}`);
            logger.info(`Parâmetros: quantidade_tokens=${novaQuantidade}, token_id=${token_Id}, usuario_id=${usuario_Id}`);

            const [results] = await pool.promise().execute(sqlQuery, [
                novaQuantidade,
                token_Id,
                usuario_Id
            ]);

            logger.info(`Atualização para usuário concluída: ${JSON.stringify(results)}`);
            logger.info(`Número de registros afetados: ${results.affectedRows}`);

            return results;
        } catch (error) {
            logger.error(`Erro ao remover pins do usuário ${usuarioId} para o token ${tokenId}:`, error);
            logger.error(`Mensagem: ${error.message}`);
            logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
            throw error;
        }
    }
};

module.exports = MoverPinsModel;

