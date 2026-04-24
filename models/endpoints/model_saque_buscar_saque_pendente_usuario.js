// models/endpoints/model_saque_buscar_saque_pendente.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarSaquePendenteModel = {
    async getSaquePendente(usuario_id) {
        const sqlQuery = `SELECT *
        FROM saques
        WHERE usuario_id = ?
        AND status_saque = "Processando"
        ;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar saques do usuario_id:', error);
                    reject(new Error('Erro ao buscar saques do usuario_id'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarSaquePendenteModel;

