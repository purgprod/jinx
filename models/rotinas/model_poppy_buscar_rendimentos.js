// models/rotinas/model_buscar_poppy_rendimentos.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarRendimentosModel = {
    async getRendimentos(data = null) {
        const sqlQuery = `SELECT *
        FROM rendimentos
        WHERE DATE(data_criacao) = ?`;

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [data], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar rendimentos:', error);
                    reject(new Error('Erro ao buscar rendimentos'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarRendimentosModel;

