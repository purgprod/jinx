// models/rotinas/model_tokens_historico_free_float.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const TokensModel = {
    async getActiveTokens() {
        const query = 'SELECT id_token FROM tokens WHERE status_ativo = 1 OR flag_sinistro = 1';

        return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar tokens ativos:', error);
                    reject(new Error('Erro ao buscar tokens ativos: ' + error.message));
                } else {
                    logger.info(`Resultado da consulta: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = TokensModel;
