// models/assinaturas/model_buscar_porcentagem_assinatura.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const PorcentagemAssinaturaBuscarModel = {
    async getPorcentagem() {
        const sqlQuery = 'SELECT porcentagem_assinatura FROM porcentagem_assinatura WHERE id = 1;'
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar porcentagem da assinatura:', error);
		    reject(new Error('Erro ao buscar porcentagem da assinatura'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = PorcentagemAssinaturaBuscarModel;

