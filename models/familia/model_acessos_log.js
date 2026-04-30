const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class AcessosLogModel {

    static async registrar({ guardiao_id, tutelado_id, acao = 'acesso_perfil' }) {
        try {
            await pool.promise().execute(
                `INSERT INTO familia_acessos_log (guardiao_id, tutelado_id, acao) VALUES (?, ?, ?)`,
                [guardiao_id, tutelado_id, acao]
            );
        } catch (err) {
            logger.error(`Erro ao registrar log de acesso familiar: ${err.message}`);
        }
    }

    static async listarPorTutelado(tutelado_id, limite = 50) {
        const [rows] = await pool.promise().execute(
            `SELECT fal.*, u.apelido AS guardiao_nome
             FROM familia_acessos_log fal
             JOIN users u ON u.usuario_id = fal.guardiao_id
             WHERE fal.tutelado_id = ?
             ORDER BY fal.criado_em DESC
             LIMIT ?`,
            [tutelado_id, limite]
        );
        return rows;
    }
}

module.exports = AcessosLogModel;
