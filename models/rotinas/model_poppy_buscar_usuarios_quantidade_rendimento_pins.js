// models/rotinas/model_buscar_usuarios_quantidade_rendimento_pins.js
const pool = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const BuscarUsuariosQuantidadeRendimentoPinsModel = {
  /**
   * Retorna os usuários que possuem pins vencidos.
   * @param {number} id_token - ID do token
   */
  async getUsuariosQuantidadeRendimentoPins(id_token) {
    try {
      logger.info(`Iniciando busca de usuários para o Pins ${id_token}`);

      // Garanta que o id_token seja um número
      const token_Id = parseInt(id_token, 10);
      logger.info(`token_id processado: ${token_Id} (${typeof token_Id})`);

      const sqlQuery = `
        SELECT token_id, usuario_id, quantidade_tokens, rendimento_token
        FROM usuario_tokens
        WHERE token_id = ?
        AND quantidade_tokens > 0;
      `;

      logger.info(`Executando consulta SQL: ${sqlQuery}`);
      logger.info(`Parâmetros da consulta: ${token_Id}`);

      const [results] = await pool.promise().execute(sqlQuery, [token_Id]);

      logger.info(`Resultado da consulta: ${JSON.stringify(results)}`);
      logger.info(`Número de usuários encontrados: ${results.length}`);

      return results;
    } catch (error) {
      logger.error(`Erro ao buscar usuários com Pins vencidos para o token_id ${id_token}:`, error);
      logger.error(`Mensagem do erro: ${error.message}`);
      logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
      throw error;
    }
  },
};

module.exports = BuscarUsuariosQuantidadeRendimentoPinsModel;

