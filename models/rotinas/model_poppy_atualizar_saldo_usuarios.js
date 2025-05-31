// models/rotinas/model_poppy_atualizar_saldo_usuarios.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const AtualizarSaldoUsuariosModel = {
    async atualizarSaldo(saldo_atualizado, usuario_id) {
        const sqlQuery = 'UPDATE carteiras SET saldo = ? WHERE usuario_id = ?';
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [saldo_atualizado, usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao atualizar saldo do cliente:', error);
                    reject(new Error('Erro ao atualizar saldo do cliente'));
                } else {
                    logger.info(`Cliente ${usuario_id} teve o saldo atualizado para ${saldo_atualizado}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = AtualizarSaldoUsuariosModel;

