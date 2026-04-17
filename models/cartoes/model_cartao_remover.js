// models/cartoes/model_cartao_remover.js
const pool = require('../../database/database_purg');

const CartaoRemoverModel = {
    async removerCartao(usuarioId) {
        const [result] = await pool.promise().execute(
            'UPDATE cartoes_usuario SET ativo = 0 WHERE usuario_id = ? AND ativo = 1',
            [usuarioId]
        );
        return result.affectedRows;
    }
};

module.exports = CartaoRemoverModel;
