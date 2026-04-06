// models/assinaturas/model_buscar_porcentagem_emblemas.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const PorcentagemEmblemasBuscarModel = {
    async getPorcentagem() {
        const sqlQuery = 'SELECT porcentagem_emblemas FROM porcentagem_emblemas WHERE id = 1;'
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar porcentagem das emblemas:', error);
		    reject(new Error('Erro ao buscar porcentagem das emblemas'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = PorcentagemEmblemasBuscarModel;

