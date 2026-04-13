// models/rotinas/model_poppy_atualizar_rendimento_emb.js
// Atualiza o rendimento_token diário de cada posição EMB de um usuário
// baseado na taxa anual configurada pelo admin.
//
// rendimento_token = quantidade_tokens * (taxa_anual / 100 / 365) * valor_token_unitario
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarRendimentoEmbModel = {
    /**
     * @param {number} usuario_id
     * @param {number} token_id
     * @param {number} rendimentoDiario - valor total diário calculado para essa posição
     * @param {Object|null} conn - conexão de transação (opcional)
     */
    async atualizarRendimento(usuario_id, token_id, rendimentoDiario, conn) {
        const sqlQuery = `
            UPDATE usuario_tokens
            SET rendimento_token = ?
            WHERE usuario_id = ?
              AND token_id = ?
        `;

        try {
            const executor = conn || pool.promise();
            const [result] = await executor.execute(sqlQuery, [rendimentoDiario, usuario_id, token_id]);

            if (result.affectedRows === 0) {
                logger.warn(`Nenhuma linha atualizada para usuário ${usuario_id} token ${token_id}`);
            } else {
                logger.info(`Rendimento EMB atualizado: usuário ${usuario_id} token ${token_id} → R$ ${rendimentoDiario.toFixed(8)}`);
            }

            return result;
        } catch (error) {
            logger.error(`Erro ao atualizar rendimento EMB para usuário ${usuario_id} token ${token_id}:`, error);
            throw error;
        }
    }
};

module.exports = AtualizarRendimentoEmbModel;
