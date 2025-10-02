// models/rotinas/model_poppy_buscar_saldos_carteiras_por_usuario.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarSaldosCarteirasModel = {
    async getSaldosCarteiras(usuario_id) {
        const sqlQuery = `SELECT saldo
        FROM carteiras
        WHERE usuario_id = ?
        ;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar saldos das carteiras:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    reject(new Error('Erro ao buscar saldos das carteiras'));
                } else {
                    resolve(results);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarSaldosCarteirasModel;

