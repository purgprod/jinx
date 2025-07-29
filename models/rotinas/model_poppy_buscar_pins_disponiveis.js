// models/rotinas/model_poppy_buscar_pins_disponiveis.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const BuscarPinsDisponiveisModel = {
    async getPins() {
        const sqlQuery = `SELECT u.token_id, u.quantidade_tokens, t.risco
		FROM usuario_tokens u
		INNER JOIN tokens t
		ON u.token_id = t.id_token
		WHERE t.status_ativo = 1
		AND t.flag_sinistro = 0
		AND u.quantidade_tokens > 0
		AND u.usuario_id = 1;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar pins disponíveis:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(new Error('Erro ao buscar tokens'));
                } else {
                    resolve(results);
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarPinsDisponiveisModel;

