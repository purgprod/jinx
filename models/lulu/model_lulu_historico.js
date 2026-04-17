// models/lulu/model_lulu_historico.js
const pool = require('../../database/database_purg');

const LuluHistoricoModel = {
    async getHistorico(dias = 30) {
        const [rows] = await pool.promise().execute(
            `SELECT DATE_FORMAT(data, '%Y-%m-%d') AS data, total_pendente, total_usuarios
             FROM lulu_historico_diario
             ORDER BY data DESC
             LIMIT ?`,
            [dias]
        );
        return rows.reverse(); // cronológico
    },

    async inserirOuAtualizar(data, totalPendente, totalUsuarios) {
        await pool.promise().execute(
            `INSERT INTO lulu_historico_diario (data, total_pendente, total_usuarios)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
               total_pendente = VALUES(total_pendente),
               total_usuarios = VALUES(total_usuarios)`,
            [data, totalPendente, totalUsuarios]
        );
    }
};

module.exports = LuluHistoricoModel;
