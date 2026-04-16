// models/objetivos/model_metas_leitura.js
// Queries de leitura para a tabela objetivos (metas individuais).

const pool = require('../../database/database_purg');

async function query(sql, params, conn) {
    if (conn) {
        const [rows] = await conn.execute(sql, params);
        return rows;
    }
    const [rows] = await pool.promise().execute(sql, params);
    return rows;
}

const MetasLeitura = {
    /**
     * Retorna metas ativas de um objetivo na ordem solicitada.
     * @param {number} objetivoId
     * @param {'ASC'|'DESC'} ordem - ASC para alocação (FIFO), DESC para dedução (LIFO)
     */
    async buscarMetasAtivas(objetivoId, ordem = 'ASC', conn = null) {
        const dir = ordem === 'DESC' ? 'DESC' : 'ASC';
        const sql = `
            SELECT *
            FROM objetivos
            WHERE objetivo_id = ? AND status_ativo = 1
            ORDER BY objetivo_numero ${dir}
        `;
        return query(sql, [objetivoId], conn);
    },

    /**
     * Retorna todas as metas de um objetivo (ativas e inativas), em ASC.
     * Usado para edição/recálculo.
     */
    async buscarTodasMetas(objetivoId, conn = null) {
        const sql = `
            SELECT *
            FROM objetivos
            WHERE objetivo_id = ?
            ORDER BY objetivo_numero ASC
        `;
        return query(sql, [objetivoId], conn);
    },
};

module.exports = MetasLeitura;
