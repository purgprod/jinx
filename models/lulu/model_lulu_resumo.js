// models/lulu/model_lulu_resumo.js
const pool = require('../../database/database_purg');

const LuluResumoModel = {
    async getResumo() {
        const [rows] = await pool.promise().execute(
            `SELECT
                COALESCE(SUM(valor_taxa - valor_recuperado), 0) AS total_pendente,
                COUNT(DISTINCT usuario_id)                      AS total_usuarios
             FROM lulu_taxas
             WHERE status = 'Ativa'`
        );
        return rows[0];
    }
};

module.exports = LuluResumoModel;
