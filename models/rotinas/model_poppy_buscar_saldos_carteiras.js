// models/rotinas/model_poppy_buscar_saldos_carteiras.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarSaldosCarteirasModel = {
    async getSaldosCarteiras() {
        const sqlQuery = `SELECT usuario_id, saldo
	FROM carteiras
	WHERE status_ativo = 1
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
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
