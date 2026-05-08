const db = require('../../database/database_purg');

class EventosUsuariosModel {

    static async marcarInteragido({ evento_id, usuario_id }, conn) {
        const executor = conn ? conn : db.promise();
        await executor.execute(
            `INSERT INTO eventos_usuarios (evento_id, usuario_id, interagiu, interagido_em)
             VALUES (?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE interagiu = 1, interagido_em = NOW()`,
            [evento_id, usuario_id]
        );
    }
}

module.exports = EventosUsuariosModel;
