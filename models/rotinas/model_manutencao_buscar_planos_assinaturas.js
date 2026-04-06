// models/rotinas/model_manutencao_buscar_planos_assinaturas.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarPlanosModel = {
    async getPlanos() {
        const sqlQuery = `SELECT assinatura
	FROM users
	WHERE status_ativo = 1
	;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar planos dos usuários:', error);
		    reject(new Error('Erro ao buscar planos dos usuários'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarPlanosModel;

