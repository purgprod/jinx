// models/rotinas/model_poppy_buscar_todos_pins_clientes.js
//
// Retorna todos os pins (qualquer risco) que clientes possuem com quantidade > 0.
// Exclui explicitamente a Purg (usuario_id = 1).
// Usado pela rotina de sanitização de ambiente (vender todos os pins).
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarTodosPinsClientesModel = {
    async getTodosPins() {
        const sqlQuery = `
            SELECT
                ut.usuario_id,
                ut.token_id,
                ut.quantidade_tokens,
                t.risco
            FROM usuario_tokens ut
            INNER JOIN tokens t ON ut.token_id = t.id_token
            WHERE ut.quantidade_tokens > 0
              AND ut.usuario_id != 1
              AND ut.flag_sinistro = 0
        `;

        try {
            const [results] = await pool.promise().execute(sqlQuery);
            logger.info(`[VENDA] Total de posições de clientes encontradas: ${results.length}`);
            return results;
        } catch (error) {
            logger.error('[VENDA] Erro ao buscar todos os pins dos clientes:', error);
            throw new Error('Erro ao buscar todos os pins dos clientes');
        }
    }
};

module.exports = BuscarTodosPinsClientesModel;
