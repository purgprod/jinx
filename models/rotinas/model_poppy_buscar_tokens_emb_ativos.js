// models/rotinas/model_poppy_buscar_tokens_emb_ativos.js
//
// Retorna os tokens de Emblema (risco = 'EMB') ativos diretamente da tabela `tokens`.
// Diferente do model_poppy_buscar_pins_disponiveis, este model NÃO consulta o estoque
// da Purg (usuario_id = 1), pois Pins de Emblema têm quantidade ilimitada e a Purg
// nunca deve ter EMB em usuario_tokens.
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarTokensEmbAtivosModel = {
    async getTokensEmb() {
        const sqlQuery = `
            SELECT id_token AS token_id, risco
            FROM tokens
            WHERE risco = 'EMB'
              AND status_ativo = 1
              AND flag_sinistro = 0
        `;

        try {
            const [results] = await pool.promise().execute(sqlQuery);
            logger.info(`[EMB] Tokens EMB ativos encontrados: ${results.length}`);
            return results;
        } catch (error) {
            logger.error('[EMB] Erro ao buscar tokens EMB ativos:', error);
            throw new Error('Erro ao buscar tokens EMB ativos');
        }
    }
};

module.exports = BuscarTokensEmbAtivosModel;
