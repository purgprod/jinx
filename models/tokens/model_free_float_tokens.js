// models/tokens/model_free_float_tokens.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const TokensFreeFloatModel = {
    // Método para calcular o free float do token por ID
    async getFreeFloatTokensById(tokenId) {
        const sqlQuery = `
	    SELECT 
		t.id_token, 
		u.quantidade_tokens, 
		(t.quantidade_tokens - IFNULL(u.quantidade_tokens, 0)) AS freefloat_token
	    FROM tokens t
	    LEFT JOIN 
		usuario_tokens u ON t.id_token = u.token_id
	    WHERE t.id_token = ?
	    AND usuario_id = 1;`
	    ; // Assume que a coluna correta é 'token_id'

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [tokenId], (error, results) => {
                if (error) {
                    logger.error('Erro ao calcular freefloat do token:', error);
                    reject(new Error('Erro ao calcular freefloat do token'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = TokensFreeFloatModel;

