const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class ConvitesModel {

    static async criar({ guardiao_id, email_convidado, token_convite, expira_em }) {
        const [result] = await pool.promise().execute(
            `INSERT INTO familia_convites (guardiao_id, email_convidado, token_convite, expira_em)
             VALUES (?, ?, ?, ?)`,
            [guardiao_id, email_convidado, token_convite, expira_em]
        );
        logger.info(`Convite familiar criado para ${email_convidado} pelo guardião ${guardiao_id}`);
        return result;
    }

    static async buscarPorToken(token_convite) {
        const [rows] = await pool.promise().execute(
            `SELECT * FROM familia_convites WHERE token_convite = ? LIMIT 1`,
            [token_convite]
        );
        return rows[0] || null;
    }

    static async buscarPendentesPorGuardiaoEEmail(guardiao_id, email_convidado) {
        const [rows] = await pool.promise().execute(
            `SELECT * FROM familia_convites
             WHERE guardiao_id = ? AND email_convidado = ? AND status = 'pendente'
             LIMIT 1`,
            [guardiao_id, email_convidado]
        );
        return rows[0] || null;
    }

    static async marcarAceito(token_convite, conn) {
        const db = conn ? conn : pool.promise();
        await db.execute(
            `UPDATE familia_convites SET status = 'aceito' WHERE token_convite = ?`,
            [token_convite]
        );
    }

    static async marcarRecusado(token_convite, conn) {
        const db = conn ? conn : pool.promise();
        await db.execute(
            `UPDATE familia_convites SET status = 'cancelado' WHERE token_convite = ?`,
            [token_convite]
        );
    }

    static async listarPendentesPorGuardiao(guardiao_id) {
        const [rows] = await pool.promise().execute(
            `SELECT
                fc.id,
                fc.status,
                fc.expira_em,
                fc.criado_em,
                fc.guardiao_id,
                g.nome_completo          AS nome_guardiao,
                t.usuario_id             AS tutelado_id,
                t.nome_completo          AS nome_tutelado,
                fc.email_convidado       AS email_tutelado
             FROM familia_convites fc
             JOIN  users g ON g.usuario_id = fc.guardiao_id
             LEFT JOIN users t ON LOWER(t.email) = LOWER(fc.email_convidado COLLATE utf8mb4_unicode_ci)
             WHERE fc.guardiao_id = ? AND fc.status = 'pendente' AND fc.expira_em > NOW()
             ORDER BY fc.criado_em DESC`,
            [guardiao_id]
        );
        return rows.map(r => ({
            ...r,
            tutelado_id:   r.tutelado_id   ?? 'Sem conta criada',
            nome_tutelado: r.nome_tutelado  ?? 'Sem conta criada',
        }));
    }

    static async buscarPendentePorEmail(email) {
        const [rows] = await pool.promise().execute(
            `SELECT guardiao_id FROM familia_convites
             WHERE LOWER(email_convidado COLLATE utf8mb4_unicode_ci) = LOWER(?) AND status = 'pendente' AND expira_em > NOW()
             LIMIT 1`,
            [email]
        );
        return rows[0] || null;
    }

    static async expirarConvitesVencidos() {
        const [result] = await pool.promise().execute(
            `UPDATE familia_convites SET status = 'expirado'
             WHERE status = 'pendente' AND expira_em < NOW()`
        );
        return result.affectedRows;
    }
}

module.exports = ConvitesModel;
