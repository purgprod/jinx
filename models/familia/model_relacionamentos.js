const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class RelacionamentosModel {

    static async criar({ guardiao_id, tutelado_id, token_acesso_hash }, conn) {
        const db = conn ? conn : pool.promise();
        const [result] = await db.execute(
            `INSERT INTO familia_relacionamentos (guardiao_id, tutelado_id, token_acesso_hash)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE status = 'ativo', token_acesso_hash = VALUES(token_acesso_hash)`,
            [guardiao_id, tutelado_id, token_acesso_hash]
        );
        logger.info(`Relacionamento familiar criado/reativado: guardião ${guardiao_id} → tutelado ${tutelado_id}`);
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
            `SELECT u.usuario_id AS id, u.nome_completo
             FROM familia_relacionamentos fr
             JOIN users u ON u.usuario_id = fr.guardiao_id
             WHERE fr.tutelado_id = ? AND fr.status = 'ativo'
             ORDER BY fr.criado_em ASC`,
            [tutelado_id]
        );
        return rows;
    }

    static async contarTuteladosPorGuardiao(guardiao_id) {
        const [rows] = await pool.promise().execute(
            `SELECT COUNT(*) AS total FROM familia_relacionamentos
             WHERE guardiao_id = ? AND status = 'ativo'`,
            [guardiao_id]
        );
        return rows[0].total;
    }

    static async contarGuardioesPorTutelado(tutelado_id) {
        const [rows] = await pool.promise().execute(
            `SELECT COUNT(*) AS total FROM familia_relacionamentos
             WHERE tutelado_id = ? AND status = 'ativo'`,
            [tutelado_id]
        );
        return rows[0].total;
    }

    static async listarGuardioesElegiveis(tutelado_id) {
        const [rows] = await pool.promise().execute(
            `SELECT u.usuario_id, u.apelido, u.nome_completo, u.avatar_id, u.email
             FROM users u
             WHERE u.status_ativo = 1
               AND u.usuario_id <> 1
               AND u.usuario_id <> ?
               AND u.adulto = 1
               AND NOT EXISTS (
                   SELECT 1 FROM familia_relacionamentos fr
                   WHERE fr.guardiao_id = u.usuario_id
                     AND fr.tutelado_id = ?
                     AND fr.status = 'ativo'
               )
               AND (
                   SELECT COUNT(*) FROM familia_relacionamentos fr2
                   WHERE fr2.guardiao_id = u.usuario_id AND fr2.status = 'ativo'
               ) < 2
             ORDER BY u.apelido ASC`,
            [tutelado_id, tutelado_id]
        );
        return rows;
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
