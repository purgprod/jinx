// models/objetivos/model_metas_escrita.js
// Queries de escrita para a tabela objetivos (metas individuais).

const pool = require('../../database/database_purg');

async function execute(sql, params, conn) {
    if (conn) {
        const [result] = await conn.execute(sql, params);
        return result;
    }
    const [result] = await pool.promise().execute(sql, params);
    return result;
}

const MetasEscrita = {
    /**
     * Insere uma nova meta em um objetivo.
     */
    async criarMeta({ usuarioId, objetivoId, numero, valorInvestir, pontos, dataLimite = null }, conn) {
        return execute(
            `INSERT INTO objetivos
                 (usuario_id, objetivo_id, objetivo_numero, objetivo_investir, objetivo_pontos, data_limite)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [usuarioId, objetivoId, numero, valorInvestir, pontos, dataLimite],
            conn
        );
    },

    /**
     * Atualiza o saldo_alocado de uma meta.
     */
    async atualizarSaldoMeta(metaId, novoSaldo, conn) {
        return execute(
            'UPDATE objetivos SET saldo_alocado = ? WHERE id = ?',
            [novoSaldo, metaId],
            conn
        );
    },

    /**
     * Marca a meta como concluída (percentual atingimento = 100%).
     */
    async concluirMeta(metaId, conn) {
        return execute(
            'UPDATE objetivos SET objetivo_completo = 1 WHERE id = ?',
            [metaId],
            conn
        );
    },

    /**
     * Reabre uma meta que foi concluída mas teve saldo removido por saque.
     */
    async reabrirMeta(metaId, conn) {
        return execute(
            'UPDATE objetivos SET objetivo_completo = 0 WHERE id = ?',
            [metaId],
            conn
        );
    },

    /**
     * Cancela (soft-delete) todas as metas de um objetivo.
     * Usado ao cancelar o objetivo inteiro.
     */
    async cancelarMetasObjetivo(objetivoId, conn) {
        return execute(
            'UPDATE objetivos SET status_ativo = 0 WHERE objetivo_id = ?',
            [objetivoId],
            conn
        );
    },

    /**
     * Cancela (soft-delete) apenas as metas incompletas de um objetivo.
     * Metas já concluídas (objetivo_completo = 1) são preservadas.
     * Usa IS NULL OR = 0 porque o campo pode ser NULL em metas recém-criadas.
     */
    async cancelarMetasIncompletas(objetivoId, conn) {
        return execute(
            'UPDATE objetivos SET status_ativo = 0, saldo_alocado = 0 WHERE objetivo_id = ? AND (objetivo_completo IS NULL OR objetivo_completo = 0) AND status_ativo = 1',
            [objetivoId],
            conn
        );
    },

    /**
     * Cancela (soft-delete) todas as metas com número > fromNumero.
     * Usado para preservar a primeira meta (aporte) quando nada foi investido ainda.
     */
    async cancelarMetasAPartirDeNumero(objetivoId, fromNumero, conn) {
        return execute(
            'UPDATE objetivos SET status_ativo = 0, saldo_alocado = 0 WHERE objetivo_id = ? AND objetivo_numero > ? AND status_ativo = 1',
            [objetivoId, fromNumero],
            conn
        );
    },

    /**
     * Zera o saldo_alocado e reabre todas as metas ativas de um objetivo.
     * Usado na trava_inicial.
     */
    async resetarSaldoMetasObjetivo(objetivoId, conn) {
        return execute(
            'UPDATE objetivos SET saldo_alocado = 0, objetivo_completo = 0 WHERE objetivo_id = ? AND status_ativo = 1',
            [objetivoId],
            conn
        );
    },
};

module.exports = MetasEscrita;
