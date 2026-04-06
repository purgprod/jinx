// models/endpoints/model_buscar_saldo_carteira.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarSaldosCarteirasModel = {
    async getSaldosCarteiras(usuario_id) {
        const sqlQuery = `SELECT saldo, investido
        FROM carteiras
        WHERE usuario_id = ?
        ;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar saldos das carteiras:', error);
                    reject(new Error('Erro ao buscar saldos das carteiras'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarSaldosCarteirasModel;

