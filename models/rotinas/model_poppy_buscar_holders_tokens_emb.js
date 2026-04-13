// models/rotinas/model_poppy_buscar_holders_tokens_emb.js
// Retorna todos os usuários que possuem Pins de Emblema (risco = 'EMB') com quantidade > 0
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarHoldersTokensEmbModel = {
    async getHolders() {
        const sqlQuery = `
            SELECT
                ut.usuario_id,
                ut.token_id,
                ut.quantidade_tokens
            FROM usuario_tokens ut
            INNER JOIN tokens t ON ut.token_id = t.id_token
            WHERE t.risco = 'EMB'
              AND t.status_ativo = 1
              AND t.flag_sinistro = 0
              AND ut.quantidade_tokens > 0
              AND ut.usuario_id != 1
        `;

        try {
            const [results] = await pool.promise().execute(sqlQuery);
            logger.info(`Holders de tokens EMB encontrados: ${results.length}`);
            return results;
        } catch (error) {
            logger.error('Erro ao buscar holders de tokens EMB:', error);
            throw new Error('Erro ao buscar holders de tokens EMB');
        }
    }
};

module.exports = BuscarHoldersTokensEmbModel;
