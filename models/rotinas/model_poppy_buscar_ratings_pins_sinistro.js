const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarRatingsPinsSinistroModel = {
    async getRatingsPinsSinistro(id_token) {
        const sqlQuery = `SELECT risco
        FROM tokens 
        WHERE id_token = ?
        ;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id_token], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar ratings dos Pins em sinistro:', error);
                    reject(new Error('Erro ao buscar ratings dos Pins em sinistro'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarRatingsPinsSinistroModel;

