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

    static async marcarAceito(token_convite, conn) {
        const db = conn ? conn : pool.promise();
        await db.execute(
            `UPDATE familia_convites_guardiao SET status = 'aceito' WHERE token_convite = ?`,
            [token_convite]
        );
    }

}

module.exports = ConvitesGuardiaoModel;
