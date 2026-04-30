const pool   = require('../../database/database_purg');
const logger = require('../../logger');

async function listarVinculos(req, res) {
    try {
        const [rows] = await pool.promise().execute(`
            SELECT
                fr.id,
                fr.guardiao_id,
                ug.apelido  AS guardiao_apelido,
                ug.email    AS guardiao_email,
                fr.tutelado_id,
                ut.apelido  AS tutelado_apelido,
                ut.email    AS tutelado_email,
                ut.status_ativo AS tutelado_ativo,
                fr.criado_em
            FROM familia_relacionamentos fr
            JOIN users ug ON ug.usuario_id = fr.guardiao_id
            JOIN users ut ON ut.usuario_id = fr.tutelado_id
            WHERE fr.status = 'ativo'
            ORDER BY fr.criado_em DESC
        `);
        return res.status(200).json({ success: true, vinculos: rows });
    } catch (err) {
        logger.error(`[admin/familia] Erro ao listar vínculos: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

async function listarConvites(req, res) {
    try {
        const [rows] = await pool.promise().execute(`
            SELECT
                fc.id,
                fc.guardiao_id,
                u.apelido        AS guardiao_apelido,
                u.email          AS guardiao_email,
                fc.email_convidado,
                fc.status,
                fc.expira_em,
                fc.criado_em
            FROM familia_convites fc
            JOIN users u ON u.usuario_id = fc.guardiao_id
            ORDER BY fc.criado_em DESC
            LIMIT 200
        `);
        return res.status(200).json({ success: true, convites: rows });
    } catch (err) {
        logger.error(`[admin/familia] Erro ao listar convites: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

async function revogarVinculo(req, res) {
    const guardiaoId = parseInt(req.params.guardiao_id, 10);
    const tuteladoId = parseInt(req.params.tutelado_id, 10);

    if (!guardiaoId || !tuteladoId) {
        return res.status(400).json({ success: false, message: 'IDs inválidos.' });
    }

    try {
        const [result] = await pool.promise().execute(
            `UPDATE familia_relacionamentos SET status = 'revogado'
             WHERE guardiao_id = ? AND tutelado_id = ? AND status = 'ativo'`,
            [guardiaoId, tuteladoId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Vínculo ativo não encontrado.' });
        }

        const [restantes] = await pool.promise().execute(
            `SELECT COUNT(*) AS total FROM familia_relacionamentos
             WHERE tutelado_id = ? AND status = 'ativo'`,
            [tuteladoId]
        );

        if (restantes[0].total === 0) {
            await pool.promise().execute(
                `DELETE FROM familia_permissoes WHERE tutelado_id = ?`,
                [tuteladoId]
            );
        }

        logger.info(`[admin/familia] Vínculo revogado: guardião ${guardiaoId} → tutelado ${tuteladoId}`);
        return res.status(200).json({ success: true, message: 'Vínculo revogado com sucesso.' });
    } catch (err) {
        logger.error(`[admin/familia] Erro ao revogar vínculo: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

async function cancelarConvite(req, res) {
    const id = parseInt(req.params.id, 10);

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    try {
        const [result] = await pool.promise().execute(
            `UPDATE familia_convites SET status = 'cancelado'
             WHERE id = ? AND status = 'pendente'`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Convite pendente não encontrado.' });
        }

        logger.info(`[admin/familia] Convite ${id} cancelado pelo admin`);
        return res.status(200).json({ success: true, message: 'Convite cancelado.' });
    } catch (err) {
        logger.error(`[admin/familia] Erro ao cancelar convite: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { listarVinculos, listarConvites, revogarVinculo, cancelarConvite };
