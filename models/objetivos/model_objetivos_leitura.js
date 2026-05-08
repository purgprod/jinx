// models/objetivos/model_objetivos_leitura.js
// Queries de leitura para objetivos_descricao (cabeçalho dos objetivos).

const pool = require('../../database/database_purg');

/**
 * Executa query com conn (transação) ou pool direto.
 */
async function query(sql, params, conn) {
    if (conn) {
        const [rows] = await conn.execute(sql, params);
        return rows;
    }
    const [rows] = await pool.promise().execute(sql, params);
    return rows;
}

const ObjetivosLeitura = {
    /**
     * Retorna todos os objetivos ativos de um usuário,
     * ordenados: secundários primeiro (is_patrimonio = 0), Patrimônio por último.
     */
    async buscarObjetivosAtivos(usuarioId, conn = null) {
        const sql = `
            SELECT *
            FROM objetivos_descricao
            WHERE usuario_id = ? AND status_ativo = 1
            ORDER BY is_patrimonio ASC, objetivo_id ASC
        `;
        return query(sql, [usuarioId], conn);
    },

    /**
     * Retorna apenas os objetivos secundários (não Patrimônio).
     */
    async buscarObjetivosSecundarios(usuarioId, conn = null) {
        const sql = `
            SELECT *
            FROM objetivos_descricao
            WHERE usuario_id = ? AND status_ativo = 1 AND is_patrimonio = 0
            ORDER BY objetivo_id ASC
        `;
        return query(sql, [usuarioId], conn);
    },

    /**
     * Retorna o objetivo Patrimônio do usuário (sempre existe, criado no cadastro).
     */
    async buscarPatrimonio(usuarioId, conn = null) {
        const sql = `
            SELECT *
            FROM objetivos_descricao
            WHERE usuario_id = ? AND is_patrimonio = 1 AND status_ativo = 1
            LIMIT 1
        `;
        const rows = await query(sql, [usuarioId], conn);
        return rows[0] || null;
    },

    /**
     * Retorna um objetivo específico pelo objetivo_id, verificando pertencimento ao usuário.
     */
    async buscarObjetivoPorId(usuarioId, objetivoId, conn = null) {
        const sql = `
            SELECT *
            FROM objetivos_descricao
            WHERE objetivo_id = ? AND usuario_id = ?
            LIMIT 1
        `;
        const rows = await query(sql, [objetivoId, usuarioId], conn);
        return rows[0] || null;
    },

    /**
     * Verifica se o usuário tem ao menos um objetivo ativo com pelo menos uma meta ativa.
     * Usado para bloquear depósitos sem objetivos configurados.
     */
    async usuarioPossuiObjetivosComMetas(usuarioId, conn = null) {
        const sql = `
            SELECT COUNT(o.id) AS total
            FROM objetivos_descricao od
            INNER JOIN objetivos o ON o.objetivo_id = od.objetivo_id AND o.status_ativo = 1
            WHERE od.usuario_id = ? AND od.status_ativo = 1
            LIMIT 1
        `;
        const rows = await query(sql, [usuarioId], conn);
        return Number(rows[0]?.total ?? 0) > 0;
    },

    /**
     * Busca pontos atuais da carteira do usuário.
     */
    async buscarPontosCarteira(usuarioId, conn = null) {
        const sql = `
            SELECT pontos, pontos_permanentes, pontos_volateis, pontos_indicacao
            FROM carteiras
            WHERE usuario_id = ?
            LIMIT 1
        `;
        const rows = await query(sql, [usuarioId], conn);
        return rows[0] || null;
    },
};

module.exports = ObjetivosLeitura;
