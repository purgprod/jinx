// models/cartoes/model_cobranca_atualizar.js
const pool = require('../../database/database_purg');

const CobrancaAtualizarModel = {
    // Atualiza status e motivo — para uso fora de transação (falhas, análise)
    async atualizarStatus(id, status, motivo) {
        await pool.promise().execute(
            'UPDATE cobrancas_cartao SET status = ?, motivo = ? WHERE id = ?',
            [status, motivo || null, id]
        );
    },

    // Atualiza status e charge_id — para uso DENTRO de withTransaction (aprovação)
    async atualizarAprovada(id, chargeId, conn) {
        await conn.execute(
            "UPDATE cobrancas_cartao SET status = 'Aprovada', charge_id = ? WHERE id = ?",
            [chargeId, id]
        );
    }
};

module.exports = CobrancaAtualizarModel;
