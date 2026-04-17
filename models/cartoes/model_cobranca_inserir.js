// models/cartoes/model_cobranca_inserir.js
const pool = require('../../database/database_purg');

const CobrancaInserirModel = {
    async inserir({ usuarioId, valor, referenciaMes }) {
        const [result] = await pool.promise().execute(
            `INSERT INTO cobrancas_cartao (usuario_id, valor, status, referencia_mes)
             VALUES (?, ?, 'Processando', ?)`,
            [usuarioId, valor, referenciaMes]
        );
        return result.insertId;
    }
};

module.exports = CobrancaInserirModel;
