// models/endpoints/model_deposito_buscar_deposito_pendente.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarDepositoPendenteModel = {
    async getDepositoPendente(usuario_id) {
        const sqlQuery = `SELECT *
        FROM depositos
        WHERE usuario_id = ?
        AND status_deposito = "Analisando"
        ;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar depositos do usuario_id:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    reject(new Error('Erro ao buscar depositos do usuario_id'));
                } else {
                    resolve(results);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarDepositoPendenteModel;

