// models/projecao/model_projecao_leitura.js
'use strict';

const pool = require('../../database/database_purg');

const ProjecaoLeitura = {
    async buscarHoldings(usuarioId) {
        const [rows] = await pool.promise().execute(`
            SELECT ut.token_id, ut.quantidade_tokens, t.rendimento_token, t.vencimento, t.risco
            FROM usuario_tokens ut
            INNER JOIN tokens t ON ut.token_id = t.id_token
            WHERE ut.usuario_id = ?
              AND ut.quantidade_tokens > 0
              AND ut.flag_sinistro = 0
        `, [usuarioId]);
        return rows;
    },

    async buscarSaldo(usuarioId) {
        const [rows] = await pool.promise().execute(`
            SELECT saldo FROM carteiras WHERE usuario_id = ? AND status_ativo = 1 LIMIT 1
        `, [usuarioId]);
        return parseFloat(rows[0]?.saldo ?? 0);
    },

    async buscarMetasAtivas(usuarioId) {
        const [rows] = await pool.promise().execute(`
            SELECT o.data_limite, o.objetivo_investir
            FROM objetivos o
            INNER JOIN objetivos_descricao od ON o.objetivo_id = od.objetivo_id
            WHERE od.usuario_id = ?
              AND od.status_ativo = 1
              AND o.status_ativo = 1
              AND o.objetivo_completo = 0
              AND o.data_limite IS NOT NULL
            ORDER BY o.data_limite ASC
        `, [usuarioId]);
        return rows;
    },

    async buscarRendimentoMedioEmb() {
        const [rows] = await pool.promise().execute(`
            SELECT COALESCE(AVG(rendimento_token), 0) AS rendimento_medio
            FROM tokens
            WHERE risco = 'EMB' AND status_ativo = 1 AND flag_sinistro = 0
        `);
        return parseFloat(rows[0]?.rendimento_medio ?? 0);
    },

    async buscarRendimentoMedioEmpresa() {
        const [rows] = await pool.promise().execute(`
            SELECT COALESCE(AVG(rendimento_token), 0) AS rendimento_medio
            FROM tokens
            WHERE risco != 'EMB'
              AND status_ativo = 1
              AND flag_sinistro = 0
              AND quantidade_tokens > 0
        `);
        return parseFloat(rows[0]?.rendimento_medio ?? 0);
    },
};

module.exports = ProjecaoLeitura;
