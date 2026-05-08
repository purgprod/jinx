// models/indicacoes/model_indicacoes.js

const pool = require('../../database/database_purg');

module.exports = {
    async buscarPorIndicado(indicadoId, conn) {
        const [rows] = await (conn
            ? conn.execute('SELECT indicador_id FROM indicacoes WHERE indicado_id = ? LIMIT 1', [indicadoId])
            : pool.promise().execute('SELECT indicador_id FROM indicacoes WHERE indicado_id = ? LIMIT 1', [indicadoId]));
        return rows[0] || null;
    },

    async buscarIndicadorPorCodigo(codigo) {
        const [rows] = await pool.promise().execute(
            'SELECT usuario_id FROM users WHERE codigo_indicacao = ? AND status_ativo = 1 LIMIT 1',
            [codigo]
        );
        return rows[0] || null;
    },

    async criar({ indicadorId, indicadoId }, conn) {
        await (conn
            ? conn.execute('INSERT INTO indicacoes (indicador_id, indicado_id) VALUES (?, ?)', [indicadorId, indicadoId])
            : pool.promise().execute('INSERT INTO indicacoes (indicador_id, indicado_id) VALUES (?, ?)', [indicadorId, indicadoId]));
    },

    async contarIndicadosPorIndicador(indicadorId) {
        const [rows] = await pool.promise().execute(
            'SELECT COUNT(*) AS total FROM indicacoes WHERE indicador_id = ?',
            [indicadorId]
        );
        return Number(rows[0].total);
    },
};
