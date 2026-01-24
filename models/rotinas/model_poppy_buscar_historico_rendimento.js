// models/rotinas/model_poppy_buscar_historico_rendimento.js
const db = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarHistoricoRendimentoModel = {
    /**
     * Recupera o registro de rendimento mais recente para conferência de data.
     * @param {number|string} usuario_id 
     * @returns {Promise<Object|null>}
     */
    async getHistoricoRendimento(usuario_id) {
        const sqlQuery = `
            SELECT id, data_criacao, rendimento_diario 
            FROM rendimentos 
            WHERE usuario_id = ? 
            ORDER BY data_criacao DESC 
            LIMIT 1
        `;

        try {
            // .promise() é necessário porque o database_purg exporta o pool padrão
            const [rows] = await db.promise().query(sqlQuery, [usuario_id]);

            if (!rows || rows.length === 0) {
                return null;
            }

            return rows[0];
        } catch (error) {
            logger.error(`[Model: BuscarHistoricoRendimento] Erro na query: ${error.message}`, {
                usuario_id,
                stack: error.stack
            });
            throw new Error('Falha ao consultar histórico de rendimento.');
        }
    }
};

module.exports = BuscarHistoricoRendimentoModel;
