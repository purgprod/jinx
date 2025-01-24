// models/model_tokens.js
const connection = require('../database/database_crowdfunding');
const logger = require('../logger');

const TokensModel = {
    async getTokens() {
        const sqlQuery = 'SELECT * FROM tokens;'
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar tokens:', error);
                    reject(new Error('Erro ao buscar tokens'));
                } else {
                    resolve(results);
                }
            });
        });
    },

    async updateToken(id, data) {
        const sqlQuery = `
            UPDATE tokens
            SET razao_social = ?, risco = ?, data_criacao = ?, quantidade_tokens = ?, valor_token = ?,
                rendimento_token = ?, vencimento = ?, dias_vencimento = ?, flag_sinistro = ?, data_sinistro = ?
            WHERE id_token = ?
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
                } else {
                    logger.info(`Token com ID: ${id} atualizado com sucesso.`);
                    resolve(results);
                }
            });
        });
    },

    async inativarToken(id) {
        const sqlQuery = `UPDATE tokens SET status_ativo = 0 WHERE id_token = ?`;
        logger.info(`Iniciando inativação de Token com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inativar token com ID: ${id} - ${error.message}`);
                    reject(new Error(`Erro ao inativar token com ID: ${id}`));
                } else {
                    if (results.affectedRows > 0) {
                        logger.info(`Token com ID: ${id} inativado com sucesso.`);
                    } else {
                        logger.warn(`Nenhum token foi inativado para o ID: ${id}. Verifique se este ID existe.`);
                    }
                    resolve(results);
                }
            });
        });
    },

    async ativarToken(id) {
        const sqlQuery = `UPDATE tokens SET status_ativo = 1 WHERE id_token = ?`;
        logger.info(`Iniciando ativação de token com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao ativar token com ID: ${id} - ${error.message}`);
                    reject(new Error(`Erro ao ativar token com ID: ${id}`));
                } else {
                    if (results.affectedRows > 0) {
                        logger.info(`Token com ID: ${id} ativado com sucesso.`);
                    } else {
                        logger.warn(`Nenhum token foi ativado para o ID: ${id}. Verifique se este ID existe.`);
                    }
                    resolve(results);
                }
            });
        });
    },
};

module.exports = TokensModel;

