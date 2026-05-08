// models/familia/model_convites_guardiao.js

const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class ConvitesGuardiaoModel {

    static async criar({ tutelado_id, email_convidado, token_convite, expira_em }) {
        const [result] = await pool.promise().execute(
            `INSERT INTO familia_convites_guardiao (tutelado_id, email_convidado, token_convite, expira_em)
             VALUES (?, ?, ?, ?)`,
            [tutelado_id, email_convidado, token_convite, expira_em]
        );
        logger.info(`Convite de guardião criado para ${email_convidado} pelo tutelado ${tutelado_id}`);
        return result;
    }

    static async buscarPorToken(token_convite) {
        const [rows] = await pool.promise().execute(
            `SELECT * FROM familia_convites_guardiao WHERE token_convite = ? LIMIT 1`,
            [token_convite]
        );
        return rows[0] || null;
    }

    static async buscarPendentePorTuteladoEEmail(tutelado_id, email_convidado) {
        const [rows] = await pool.promise().execute(
            `SELECT * FROM familia_convites_guardiao
             WHERE tutelado_id = ? AND email_convidado = ? AND status = 'pendente'
             LIMIT 1`,
            [tutelado_id, email_convidado]
        );
        return rows[0] || null;
    }

    static async listarPendentesPorTutelado(tutelado_id) {
        const [rows] = await pool.promise().execute(
            `SELECT
                fcg.id,
                fcg.status,
                fcg.expira_em,
                fcg.criado_em,
                fcg.tutelado_id,
                t.nome_completo          AS nome_tutelado,
                g.usuario_id             AS guardiao_id,
                g.nome_completo          AS nome_guardiao,
                fcg.email_convidado      AS email_guardiao
             FROM familia_convites_guardiao fcg
             JOIN  users t ON t.usuario_id = fcg.tutelado_id
             LEFT JOIN users g ON LOWER(g.email) = LOWER(fcg.email_convidado)
             WHERE fcg.tutelado_id = ? AND fcg.status = 'pendente' AND fcg.expira_em > NOW()
             ORDER BY fcg.criado_em DESC`,
            [tutelado_id]
        );
        return rows.map(r => ({
            ...r,
            guardiao_id:   r.guardiao_id   ?? 'Sem conta criada',
            nome_guardiao: r.nome_guardiao  ?? 'Sem conta criada',
        }));
    }

    static async marcarAceito(token_convite, conn) {
        const db = conn ? conn : pool.promise();
        await db.execute(
            `UPDATE familia_convites_guardiao SET status = 'aceito' WHERE token_convite = ?`,
            [token_convite]
        );
    }

    static async marcarRecusado(token_convite, conn) {
        const db = conn ? conn : pool.promise();
        await db.execute(
            `UPDATE familia_convites_guardiao SET status = 'cancelado' WHERE token_convite = ?`,
            [token_convite]
        );
    }

}

module.exports = ConvitesGuardiaoModel;
