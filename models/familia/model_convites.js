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

    static async listarPendentesPorGuardiao(guardiao_id) {
        const [rows] = await pool.promise().execute(
            `SELECT id, email_convidado, expira_em, criado_em
             FROM familia_convites
             WHERE guardiao_id = ? AND status = 'pendente' AND expira_em > NOW()
             ORDER BY criado_em DESC`,
            [guardiao_id]
        );
        return rows;
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
