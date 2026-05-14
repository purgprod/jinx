// models/rotinas/model_resumo_semanal.js
const pool = require('../../database/database_purg');

const ResumoSemanalModel = {
    async buscarUsuariosAtivos() {
        const [rows] = await pool.promise().execute(`
            SELECT
                u.usuario_id,
                u.apelido,
                u.celular,
                c.saldo,
                c.investido,
                c.pontos AS pontos_total,
                c.liga,
                r.posicao AS posicao_ranking
            FROM users u
            INNER JOIN carteiras c ON c.usuario_id = u.usuario_id AND c.status_ativo = 1
            LEFT JOIN ranking r ON r.usuario_id = u.usuario_id
            WHERE u.nami_ativo = 1
              AND u.celular IS NOT NULL
              AND u.apelido IS NOT NULL
        `);
        return rows;
    },

    async buscarRendimentoTotal(usuarioId) {
        const [rows] = await pool.promise().execute(
            `SELECT COALESCE(SUM(rendimento_diario), 0) AS rendimento_total
             FROM rendimentos WHERE usuario_id = ?`,
            [usuarioId]
        );
        return rows[0]?.rendimento_total ?? '0.00';
    },

    async buscarRendimentoSemana(usuarioId) {
        const [rows] = await pool.promise().execute(
            `SELECT COALESCE(SUM(rendimento_diario), 0) AS rendimento_semana
             FROM rendimentos
             WHERE usuario_id = ?
               AND DATE(data_criacao) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`,
            [usuarioId]
        );
        return rows[0]?.rendimento_semana ?? '0.00';
    },

    async buscarDepositosSemana(usuarioId) {
        const [rows] = await pool.promise().execute(
            `SELECT COALESCE(SUM(valor_deposito), 0) AS depositos_semana
             FROM depositos
             WHERE usuario_id = ?
               AND status_deposito = 'Executado'
               AND DATE(data_criacao) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`,
            [usuarioId]
        );
        return rows[0]?.depositos_semana ?? '0.00';
    },

    async buscarSaquesSemana(usuarioId) {
        const [rows] = await pool.promise().execute(
            `SELECT COALESCE(SUM(valor_saque), 0) AS saques_semana
             FROM saques
             WHERE usuario_id = ?
               AND status_saque = 'Executado'
               AND DATE(data_criacao) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`,
            [usuarioId]
        );
        return rows[0]?.saques_semana ?? '0.00';
    },

    async buscarProximaMeta(usuarioId) {
        const [rows] = await pool.promise().execute(
            `SELECT o.data_limite, o.objetivo_investir, o.saldo_alocado,
                    od.objetivo_valor_total, od.saldo_alocado_total
             FROM objetivos o
             INNER JOIN objetivos_descricao od ON od.objetivo_id = o.objetivo_id
             WHERE od.usuario_id = ?
               AND o.status_ativo = 1
               AND o.objetivo_completo = 0
             ORDER BY od.objetivo_id ASC, o.objetivo_numero ASC
             LIMIT 1`,
            [usuarioId]
        );
        return rows[0] || null;
    },
};

module.exports = ResumoSemanalModel;
