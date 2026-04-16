// models/objetivos/model_objetivos_escrita.js
// Queries de escrita para objetivos_descricao (cabeçalho dos objetivos).

const pool = require('../../database/database_purg');
const logger = require('../../logger');

async function execute(sql, params, conn) {
    if (conn) {
        const [result] = await conn.execute(sql, params);
        return result;
    }
    const [result] = await pool.promise().execute(sql, params);
    return result;
}

const ObjetivosEscrita = {
    /**
     * Insere um novo cabeçalho de objetivo.
     * Retorna o insertId; objetivo_id será igual ao id (atualizado logo após).
     */
    async criarObjetivo({ usuarioId, descricao, numeroTotal, valorTotal, pontosTotal, isPatrimonio }, conn) {
        const sql = `
            INSERT INTO objetivos_descricao
                (usuario_id, objetivo_descricao, objetivo_numero_total, objetivo_valor_total,
                 objetivo_pontos_total, is_patrimonio, objetivo_id)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        `;
        const result = await execute(sql, [
            usuarioId, descricao, numeroTotal, valorTotal, pontosTotal, isPatrimonio ? 1 : 0
        ], conn);

        // objetivo_id espelha o id auto-increment
        const newId = result.insertId;
        await execute(
            'UPDATE objetivos_descricao SET objetivo_id = ? WHERE id = ?',
            [newId, newId],
            conn
        );
        return newId;
    },

    /**
     * Atualiza o saldo_alocado_total do objetivo.
     */
    async atualizarSaldoTotal(objetivoId, novoSaldoTotal, conn) {
        return execute(
            'UPDATE objetivos_descricao SET saldo_alocado_total = ? WHERE objetivo_id = ?',
            [novoSaldoTotal, objetivoId],
            conn
        );
    },

    /**
     * Marca o primeiro_aporte_feito = 1 (trava_inicial não será mais verificada).
     */
    async marcarPrimeiroAporte(objetivoId, conn) {
        return execute(
            'UPDATE objetivos_descricao SET primeiro_aporte_feito = 1 WHERE objetivo_id = ?',
            [objetivoId],
            conn
        );
    },

    /**
     * Marca o objetivo como concluído.
     */
    async concluirObjetivo(objetivoId, conn) {
        return execute(
            'UPDATE objetivos_descricao SET objetivo_completo = 1 WHERE objetivo_id = ?',
            [objetivoId],
            conn
        );
    },

    /**
     * Cancela o objetivo (soft-delete).
     */
    async cancelarObjetivo(objetivoId, conn) {
        return execute(
            'UPDATE objetivos_descricao SET status_ativo = 0 WHERE objetivo_id = ?',
            [objetivoId],
            conn
        );
    },

    /**
     * Atualiza descricao, valor_total, numero_total e pontos_total de um objetivo (para edição/recalculo).
     */
    async editarObjetivo({ objetivoId, descricao, valorTotal, numeroTotal, pontosTotal }, conn) {
        return execute(
            `UPDATE objetivos_descricao
             SET objetivo_descricao = ?, objetivo_valor_total = ?,
                 objetivo_numero_total = ?, objetivo_pontos_total = ?,
                 objetivo_completo = 0
             WHERE objetivo_id = ?`,
            [descricao, valorTotal, numeroTotal, pontosTotal, objetivoId],
            conn
        );
    },

    /**
     * Registra um evento de recálculo no histórico.
     */
    async registrarRecalculo({ usuarioId, objetivoId, motivo, saldoNaData }, conn) {
        return execute(
            `INSERT INTO objetivos_recalculos_historico
                 (usuario_id, objetivo_id, motivo, saldo_na_data)
             VALUES (?, ?, ?, ?)`,
            [usuarioId, objetivoId, motivo, saldoNaData],
            conn
        );
    },

    /**
     * Adiciona pontos ao pontos_permanentes e recalcula carteiras.pontos.
     */
    async adicionarPontosPermanentes(usuarioId, delta, conn) {
        // Leitura dos valores atuais para calcular o novo total com segurança
        const [rows] = await (conn
            ? conn.execute('SELECT pontos_permanentes, pontos_volateis FROM carteiras WHERE usuario_id = ? FOR UPDATE', [usuarioId])
            : pool.promise().execute('SELECT pontos_permanentes, pontos_volateis FROM carteiras WHERE usuario_id = ?', [usuarioId]));

        if (!rows.length) {
            logger.warn(`[ObjetivosEscrita] Carteira não encontrada para usuário ${usuarioId}`);
            return;
        }

        const novoPermanentes = Number(rows[0].pontos_permanentes) + delta;
        const novoTotal = novoPermanentes + Number(rows[0].pontos_volateis);

        return execute(
            'UPDATE carteiras SET pontos_permanentes = ?, pontos = ? WHERE usuario_id = ?',
            [novoPermanentes, novoTotal, usuarioId],
            conn
        );
    },

    /**
     * Atualiza pontos_volateis e recalcula carteiras.pontos.
     */
    async atualizarPontosVolateis(usuarioId, novoPontosVolateis, conn) {
        const [rows] = await (conn
            ? conn.execute('SELECT pontos_permanentes FROM carteiras WHERE usuario_id = ?', [usuarioId])
            : pool.promise().execute('SELECT pontos_permanentes FROM carteiras WHERE usuario_id = ?', [usuarioId]));

        if (!rows.length) return;

        const novoTotal = Number(rows[0].pontos_permanentes) + novoPontosVolateis;

        return execute(
            'UPDATE carteiras SET pontos_volateis = ?, pontos = ? WHERE usuario_id = ?',
            [novoPontosVolateis, novoTotal, usuarioId],
            conn
        );
    },

    /**
     * Cria o objetivo Patrimônio automaticamente no cadastro do usuário.
     * Sem metas — o usuário deve configurá-las antes do primeiro depósito.
     */
    async criarPatrimonio(usuarioId, conn) {
        return ObjetivosEscrita.criarObjetivo({
            usuarioId,
            descricao: 'Patrimônio',
            numeroTotal: 0,
            valorTotal: 0,
            pontosTotal: 0,
            isPatrimonio: true,
        }, conn);
    },
};

module.exports = ObjetivosEscrita;
