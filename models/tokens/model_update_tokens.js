// models/tokens/model_update_tokens.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const TokensUpdateModel = {
    async updateToken(id, data) {
        const sqlQuery = `
            UPDATE tokens
            SET razao_social = ?, risco = ?, data_criacao = ?, quantidade_tokens = ?, valor_token = ?,
                rendimento_token = ?, vencimento = ?, dias_vencimento = ?, flag_sinistro = ?, data_sinistro = ?
            WHERE id_resultado = ?
        `;
        const values = [
            data.razao_social, data.risco, data.data_criacao, data.quantidade_tokens, data.valor_token,
            data.rendimento_token, data.vencimento, data.dias_vencimento, data.flag_sinistro, data.data_sinistro, 
            id
        ];

        logger.info(`Executando update para token com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, values, (error, results) => {
                if (error) {
                    logger.error(`Erro ao atualizar token com ID: ${id} - ${error.message}`);
                    reject(new Error(`Erro ao atualizar token com ID: ${id}`));
		    logger.info(`Resposta: ${JSON.stringify(results)}`);
                } else {
                    logger.info(`Token com ID: ${id} atualizado com sucesso.`);
                    resolve(results);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		}
            });
        });
    }
};

module.exports = TokensUpdateModel;

