const db = require('../../database/database_purg');

class EventosModel {

    static async criar({ tipo, titulo, mensagem, acao = null, payload = null, usuario_id = null, expira_em = null }, conn) {
        const executor = conn ? conn : db.promise();
        const [result] = await executor.execute(
            `INSERT INTO eventos (tipo, titulo, mensagem, acao, payload, usuario_id, expira_em)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tipo, titulo, mensagem, acao, payload ? JSON.stringify(payload) : null, usuario_id, expira_em]
        );
        return result.insertId;
    }

    static async buscarPorId(id) {
        const [rows] = await db.promise().execute(
            'SELECT * FROM eventos WHERE id = ? LIMIT 1',
            [id]
        );
        if (!rows[0]) return null;
        return { ...rows[0], payload: rows[0].payload ? JSON.parse(rows[0].payload) : null };
    }

    // Retorna eventos pendentes para um usuário: eventos do próprio usuário + eventos globais (usuario_id NULL)
    // que ainda não foram interagidos
    static async buscarPendentesParaUsuario(usuario_id) {
        const [rows] = await db.promise().execute(
            `SELECT e.id, e.tipo, e.titulo, e.mensagem, e.acao, e.payload, e.usuario_id, e.criado_em, e.expira_em
             FROM eventos e
             LEFT JOIN eventos_usuarios eu ON eu.evento_id = e.id AND eu.usuario_id = ?
             WHERE e.ativo = 1
               AND (e.expira_em IS NULL OR e.expira_em > NOW())
               AND (e.usuario_id = ? OR e.usuario_id IS NULL)
               AND (eu.id IS NULL OR eu.interagiu = 0)
             ORDER BY e.criado_em ASC`,
            [usuario_id, usuario_id]
        );
        return rows.map(r => ({ ...r, payload: r.payload ? JSON.parse(r.payload) : null }));
    }

    // Busca um evento pelo token armazenado no payload — usado ao aceitar/rejeitar convite
    static async buscarPorTokenNoPayload(token, usuario_id) {
        const [rows] = await db.promise().execute(
            `SELECT id FROM eventos
             WHERE usuario_id = ?
               AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.token')) = ?
               AND ativo = 1
             LIMIT 1`,
            [usuario_id, token]
        );
        return rows[0] || null;
    }
}

module.exports = EventosModel;
