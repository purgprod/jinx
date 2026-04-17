// services/liga_service.js
// Sincroniza pontos e liga de um único usuário imediatamente após eventos financeiros
// (depósito confirmado, saque criado, saque revertido).

const pool   = require('../database/database_purg');
const logger = require('../logger');
const ligas  = require('../controllers/rotinas/ligas');
const { sincronizarPontosUsuario } = require('./objetivos_service');

const ligasOrdenadas = [...ligas].sort((a, b) => b.valorMinimo - a.valorMinimo);

/**
 * Recalcula pontos e determina a liga do usuário, atualizando carteiras.liga.
 * Deve ser chamado fora de transação (após commit) em setImmediate.
 *
 * @param {number} usuarioId
 * @returns {Promise<string>} nomeLiga atualizado
 */
async function sincronizarLigaUsuario(usuarioId) {
    const pontos = await sincronizarPontosUsuario(usuarioId);

    const [userRows] = await pool.promise().execute(
        'SELECT assinatura FROM users WHERE usuario_id = ? AND status_ativo = 1',
        [usuarioId]
    );

    if (!userRows.length) {
        logger.warn(`[LigaService] Usuário ${usuarioId} não encontrado ou inativo.`);
        return null;
    }

    let nomeLiga = 'Cobre I';
    if (userRows[0].assinatura !== 'Poppy Basic') {
        for (const liga of ligasOrdenadas) {
            if (pontos >= liga.valorMinimo) {
                nomeLiga = liga.nomeLiga;
                break;
            }
        }
    }

    await pool.promise().execute(
        'UPDATE carteiras SET liga = ? WHERE usuario_id = ?',
        [nomeLiga, usuarioId]
    );

    logger.info(`[LigaService] Usuário ${usuarioId} → pontos=${pontos}, liga=${nomeLiga}`);
    return nomeLiga;
}

module.exports = { sincronizarLigaUsuario };
