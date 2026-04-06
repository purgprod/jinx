// models/rotinas/model_poppy_buscar_sinistro_carteiras.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarSinistroCarteirasModel = {
    async getSinistroCarteiras() {
        const sqlQuery = `SELECT usuario_id, sinistro
	FROM carteiras
	WHERE status_ativo = 1
	AND usuario_id != 1
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar sinistro das carteiras:', error);
		    reject(new Error('Erro ao buscar sinistro das carteiras'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarSinistroCarteirasModel;

