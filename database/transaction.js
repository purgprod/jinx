// database/transaction.js
// Helper para executar múltiplas operações de banco em uma única transação MySQL.
//
// Uso:
//   const { withTransaction } = require('../database/transaction');
//
//   await withTransaction(async (conn) => {
//       await ModelA.metodo(args, conn);
//       await ModelB.metodo(args, conn);
//   });
//
// Se qualquer operação lançar erro, toda a transação é revertida (ROLLBACK)
// e o erro é re-lançado para o caller tratar.

const pool = require('./database_purg');

/**
 * Executa `callback(conn)` dentro de uma transação MySQL.
 * Em caso de sucesso faz COMMIT; em caso de erro faz ROLLBACK.
 *
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} callback
 * @returns {Promise<any>} Retorno do callback.
 */
async function withTransaction(callback) {
    const conn = await pool.promise().getConnection();
    try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

module.exports = { withTransaction };
