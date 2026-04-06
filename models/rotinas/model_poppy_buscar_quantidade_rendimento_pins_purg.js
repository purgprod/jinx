// models/rotinas/model_poppy_buscar_quantidade_rendimento_pins_purg.js
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarQuantidadeRendimentoPinsPurgModel = {
  /**
   * Retorna os usuários que possuem pins vencidos.
   * @param {number} id_token - ID do token
   */
  async getQuantidadeRendimentoPinsPurg(id_token) {
    try {
      logger.info(`Iniciando busca de usuários para o Pins ${id_token}`);

      // Garanta que o id_token seja um número
      const token_Id = parseInt(id_token, 10);
      logger.info(`token_id processado: ${token_Id} (${typeof token_Id})`);

      const sqlQuery = `
        SELECT quantidade_tokens, rendimento_token
        FROM usuario_tokens
        WHERE token_id = ?
        AND usuario_id = 1;
      `;

      logger.info(`Executando consulta SQL: ${sqlQuery}`);
      logger.info(`Parâmetros da consulta: ${token_Id}`);

      const [results] = await pool.promise().execute(sqlQuery, [token_Id]);

      logger.info(`Resultado da consulta: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
      logger.info(`Número de usuários encontrados: ${results.length}`);

      return results;
    } catch (error) {
      logger.error(`Erro ao buscar quantidade_tokens e rendimento_token da Purg para o Pin: ${id_token}`, error);
      logger.error(`Mensagem do erro: ${error.message}`);
      logger.error(`Consulta SQL: ${error.sql || 'SQL não disponível'}`);
      throw error;
    }
  },
};

module.exports = BuscarQuantidadeRendimentoPinsPurgModel;

