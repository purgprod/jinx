// models/rotinas/model_buscar_pins.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarPinsModel = {
    async getPins() {
        const sqlQuery = `SELECT *
	FROM tokens
	WHERE status_ativo = 1
	AND dias_vencimento = 0
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar Pins ativos:', error);
		    reject(new Error('Erro ao buscar Pins ativos'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarPinsModel;

