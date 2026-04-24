// models/depositos/model_deposito_buscar_por_valor.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarDepositoPorValorModel = {
    async getDepositoPorValorUnico(valorUnico) {
        const query = `
            SELECT *
            FROM depositos
            WHERE valor_unico = ?
              AND status_deposito = 'Processando'
            LIMIT 1;
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [valorUnico], (error, results) => {
                if (error) {
                    logger.error('[Model] Erro ao buscar depósito por valor_unico:', error);
                    return reject(new Error('Erro ao buscar depósito por valor_unico.'));
                }
                resolve(results[0] || null);
            });
        });
    }
};

module.exports = BuscarDepositoPorValorModel;
