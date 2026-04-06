// models/rotinas/model_buscar_rotinas.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const RotinasBuscarModel = {
    async getRotinas() {
        const sqlQuery = 'SELECT * FROM rotinas;'
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar rotinas:', error);
		    reject(new Error('Erro ao buscar rotinas'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = RotinasBuscarModel;

