// models/lulu/model_lulu_top10.js
const pool = require('../../database/database_purg');

const LuluTop10Model = {
    async getTop10() {
        const [rows] = await pool.promise().execute(
            `SELECT
                u.usuario_id,
                u.apelido,
                u.nome_completo,
                SUM(lt.valor_taxa - lt.valor_recuperado) AS valor_pendente,
                MIN(lt.criado_em)                        AS desde
             FROM lulu_taxas lt
             INNER JOIN users u ON u.usuario_id = lt.usuario_id
             WHERE lt.status = 'Ativa'
             GROUP BY u.usuario_id, u.apelido, u.nome_completo
             ORDER BY valor_pendente DESC
             LIMIT 10`
        );
        return rows;
    }
};

module.exports = LuluTop10Model;
