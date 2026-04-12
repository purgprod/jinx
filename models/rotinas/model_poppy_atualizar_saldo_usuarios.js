// models/rotinas/model_poppy_atualizar_saldo_usuarios.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarSaldoUsuariosModel = {
    async atualizarSaldo(saldo_atualizado, usuario_id, conn) {
        const sqlQuery = 'UPDATE carteiras SET saldo = ? WHERE usuario_id = ?';
        const saldoFormatado = parseFloat(saldo_atualizado).toFixed(8);

        if (conn) {
            const [results] = await conn.execute(sqlQuery, [saldoFormatado, usuario_id]);
            logger.info(`Cliente ${usuario_id} teve o saldo atualizado para ${saldoFormatado}`);
            return results;
        }

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [saldoFormatado, usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao atualizar saldo do cliente:', error);
                    reject(new Error('Erro ao atualizar saldo do cliente'));
                } else {
                    logger.info(`Cliente ${usuario_id} teve o saldo atualizado para ${saldoFormatado}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = AtualizarSaldoUsuariosModel;

