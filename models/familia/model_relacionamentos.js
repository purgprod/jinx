const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class RelacionamentosModel {

    static async criar({ guardiao_id, tutelado_id, token_acesso_hash }, conn) {
        const db = conn ? conn : pool.promise();
        const [result] = await db.execute(
            `INSERT INTO familia_relacionamentos (guardiao_id, tutelado_id, token_acesso_hash)
             VALUES (?, ?, ?)`,
            [guardiao_id, tutelado_id, token_acesso_hash]
        );
        logger.info(`Relacionamento familiar criado: guardião ${guardiao_id} → tutelado ${tutelado_id}`);
        return result;
    }

    static async buscarPorPar(guardiao_id, tutelado_id) {
        const [rows] = await pool.promise().execute(
            `SELECT * FROM familia_relacionamentos
             WHERE guardiao_id = ? AND tutelado_id = ? AND status = 'ativo'
             LIMIT 1`,
            [guardiao_id, tutelado_id]
        );
        return rows[0] || null;
    }

    static async listarTuteladosPorGuardiao(guardiao_id) {
        const [rows] = await pool.promise().execute(
            `SELECT fr.id, fr.tutelado_id, fr.criado_em,
                    u.apelido AS tutelado_nome, u.email AS tutelado_email
             FROM familia_relacionamentos fr
             JOIN users u ON u.usuario_id = fr.tutelado_id
             WHERE fr.guardiao_id = ? AND fr.status = 'ativo'
             ORDER BY fr.criado_em ASC`,
            [guardiao_id]
        );
        return rows;
    }

    static async listarGuardioesPorTutelado(tutelado_id) {
        const [rows] = await pool.promise().execute(
            `SELECT fr.id, fr.guardiao_id, fr.criado_em,
                    u.apelido AS guardiao_nome, u.email AS guardiao_email
             FROM familia_relacionamentos fr
             JOIN users u ON u.usuario_id = fr.guardiao_id
             WHERE fr.tutelado_id = ? AND fr.status = 'ativo'
             ORDER BY fr.criado_em ASC`,
            [tutelado_id]
        );
        return rows;
    }

    static async contarGuardioesPorTutelado(tutelado_id) {
        const [rows] = await pool.promise().execute(
            `SELECT COUNT(*) AS total FROM familia_relacionamentos
             WHERE tutelado_id = ? AND status = 'ativo'`,
            [tutelado_id]
        );
        return rows[0].total;
    }

    static async revogar(guardiao_id, tutelado_id) {
        const [result] = await pool.promise().execute(
            `UPDATE familia_relacionamentos SET status = 'revogado'
             WHERE guardiao_id = ? AND tutelado_id = ? AND status = 'ativo'`,
            [guardiao_id, tutelado_id]
        );
        logger.info(`Relacionamento revogado: guardião ${guardiao_id} → tutelado ${tutelado_id}`);
        return result;
    }
}

module.exports = RelacionamentosModel;
