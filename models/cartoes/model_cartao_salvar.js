// models/cartoes/model_cartao_salvar.js
const pool = require('../../database/database_purg');

const CartaoSalvarModel = {
    // Desativa todos os cartões anteriores e insere o novo como ativo.
    async salvarCartao({ usuarioId, paymentToken, bandeira, ultimosDigitos, nomeTitular, mesValidade, anoValidade }) {
        const conn = await pool.promise().getConnection();
        try {
            await conn.beginTransaction();

            await conn.execute(
                'UPDATE cartoes_usuario SET ativo = 0 WHERE usuario_id = ?',
                [usuarioId]
            );

            const [result] = await conn.execute(
                `INSERT INTO cartoes_usuario
                    (usuario_id, payment_token, bandeira, ultimos_digitos, nome_titular, mes_validade, ano_validade, ativo)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [usuarioId, paymentToken, bandeira || null, ultimosDigitos || null,
                 nomeTitular || null, mesValidade || null, anoValidade || null]
            );

            await conn.commit();
            return result.insertId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
};

module.exports = CartaoSalvarModel;
