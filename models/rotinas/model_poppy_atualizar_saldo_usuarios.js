// models/rotinas/model_poppy_atualizar_saldo_usuarios.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarSaldoUsuariosModel = {
    async atualizarSaldo(saldo_atualizado, usuario_id) {
        const sqlQuery = 'UPDATE carteiras SET saldo = ? WHERE usuario_id = ?';

        // Formatar o saldo para garantir 8 casas decimais
        const saldoFormatado = parseFloat(saldo_atualizado).toFixed(8);

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

