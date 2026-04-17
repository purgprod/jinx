// models/cartoes/model_cartao_buscar.js
const pool = require('../../database/database_purg');

const CartaoBuscarModel = {
    async getCartaoAtivo(usuarioId) {
        const [rows] = await pool.promise().execute(
            `SELECT id, bandeira, ultimos_digitos, nome_titular, mes_validade, ano_validade, criado_em
             FROM cartoes_usuario
             WHERE usuario_id = ? AND ativo = 1
             ORDER BY criado_em DESC
             LIMIT 1`,
            [usuarioId]
        );
        return rows[0] ?? null;
    }
};

module.exports = CartaoBuscarModel;
