const pool   = require('../../database/database_purg');
const logger = require('../../logger');

class PermissoesModel {

    static async criar(tutelado_id, conn) {
        const db = conn ? conn : pool.promise();
        await db.execute(
            `INSERT IGNORE INTO familia_permissoes (tutelado_id) VALUES (?)`,
            [tutelado_id]
        );
        logger.info(`Permissões iniciais criadas para tutelado ${tutelado_id}`);
    }

    static async buscarPorTutelado(tutelado_id) {
        const [rows] = await pool.promise().execute(
            `SELECT * FROM familia_permissoes WHERE tutelado_id = ? LIMIT 1`,
            [tutelado_id]
        );
        if (!rows[0]) return null;

        const p = rows[0];
        let chaves = [];
        try {
            chaves = typeof p.chaves_pix_autorizadas === 'string'
                ? JSON.parse(p.chaves_pix_autorizadas)
                : (p.chaves_pix_autorizadas || []);
        } catch {
            chaves = [];
        }

        return {
            tutelado_id:            p.tutelado_id,
            pode_sacar:             !!p.pode_sacar,
            chaves_pix_autorizadas: chaves,
            pode_depositar:         !!p.pode_depositar,
            pode_alterar_perfil:    !!p.pode_alterar_perfil,
            pode_alterar_pix:       !!p.pode_alterar_pix,
            atualizado_em:          p.atualizado_em,
        };
    }

    static async atualizar(tutelado_id, campos) {
        const camposPermitidos = [
            'pode_sacar', 'chaves_pix_autorizadas', 'pode_depositar',
            'pode_alterar_perfil', 'pode_alterar_pix',
        ];

        const sets  = [];
        const vals  = [];

        for (const [k, v] of Object.entries(campos)) {
            if (!camposPermitidos.includes(k)) continue;
            sets.push(`${k} = ?`);
            vals.push(k === 'chaves_pix_autorizadas' ? JSON.stringify(v) : v);
        }

        if (sets.length === 0) return;

        vals.push(tutelado_id);
        await pool.promise().execute(
            `UPDATE familia_permissoes SET ${sets.join(', ')} WHERE tutelado_id = ?`,
            vals
        );
        logger.info(`Permissões atualizadas para tutelado ${tutelado_id}`);
    }

    static async excluir(tutelado_id, conn) {
        const db = conn ? conn : pool.promise();
        await db.execute(
            `DELETE FROM familia_permissoes WHERE tutelado_id = ?`,
            [tutelado_id]
        );
    }
}

module.exports = PermissoesModel;
