// models/lulu/model_lulu_usuarios_para_deduzir.js
// Retorna todas as taxas Ativas de usuários que receberam rendimento hoje,
// ordenadas por (usuario_id, criado_em ASC) para processamento FIFO.
const pool = require('../../database/database_purg');

const LuluUsuariosParaDeduzirModel = {
    async getRegistros() {
        const [rows] = await pool.promise().execute(
            `SELECT
                lt.id                                        AS taxa_id,
                lt.usuario_id,
                lt.valor_taxa,
                lt.valor_recuperado,
                (lt.valor_taxa - lt.valor_recuperado)        AS valor_restante,
                r.rendimento_diario,
                lc.percentual_deducao
             FROM lulu_taxas lt
             INNER JOIN users u
                     ON u.usuario_id = lt.usuario_id AND u.status_ativo = 1
             INNER JOIN rendimentos r
                     ON r.usuario_id = lt.usuario_id
                    AND DATE(r.data_criacao) = CURDATE()
             CROSS JOIN lulu_config lc
             WHERE lt.status = 'Ativa'
               AND r.rendimento_diario > 0
             ORDER BY lt.usuario_id, lt.criado_em ASC`
        );
        return rows;
    }
};

module.exports = LuluUsuariosParaDeduzirModel;
