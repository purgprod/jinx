// models/endpoints/model_deposito_buscar_deposito_pendente_usuario.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarDepositoPendenteModel = {
    async getDepositoPendente(usuario_id) {
        const sqlQuery = `SELECT *
        FROM depositos
        WHERE usuario_id = ?
        AND status_deposito = "Processando"
        ;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar depositos do usuario_id:', error);
                    reject(new Error('Erro ao buscar depositos do usuario_id'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarDepositoPendenteModel;

