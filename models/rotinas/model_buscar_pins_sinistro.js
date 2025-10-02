// models/rotinas/model_buscar_pins_sinistro.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarPinsSinistroModel = {
    async getPinsSinistro() {
        const sqlQuery = `SELECT t.id_token
	FROM tokens t
	INNER JOIN resultados_financeiros rf
	ON t.id_resultado = rf.id_resultado
	WHERE t.flag_sinistro = 1
	AND rf.status_ativo = 1
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar pins em sinistro:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(new Error('Erro ao buscar pins em sinistro'));
                } else {
                    resolve(results);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarPinsSinistroModel;

