const mysql = require('mysql2');
const pool = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const AtualizarQuantidadeTokensModel = {
    async atualizarQuantidadeTokens(usuario_id, token_id, quantidade_tokens) {
        const sql = 'INSERT INTO usuario_tokens (usuario_id, token_id, quantidade_tokens) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade_tokens = ?';
        
        return new Promise((resolve, reject) => {
            pool.promise().execute(sql, [usuario_id, token_id, quantidade_tokens, quantidade_tokens])
                .then((results) => {
                    logger.info(`Token ${token_id} do usuário ${usuario_id} atualizado com sucesso`);
                    resolve(results);
                })
                .catch((error) => {
                    logger.error(`Erro ao atualizar/atualizar a quantidade de tokens:`, error);
                    reject(new Error('Erro ao atualizar/atualizar a quantidade de tokens'));
                });
        });
    },

    async gravarTransacao(usuario_id, token_id, quantidade_tokens) {
        const sqlInsert = 'INSERT INTO transacoes (usuario_id, id_token, quantidade_token, valor_transacao, tipo_transacao) VALUES (?, ?, ?, ?, ?)';
        const valorTransacao = quantidade_tokens * 0.01;
        
        return new Promise((resolve, reject) => {
            pool.promise().execute(sqlInsert, [usuario_id, token_id, quantidade_tokens, valorTransacao, 'C'])
                .then((results) => {
                    logger.info(`Transação gravada com sucesso`);
                    resolve(results);
                })
                .catch((error) => {
                    logger.error(`Erro ao gravar transação:`, error);
                    reject(new Error('Erro ao gravar transação'));
                });
        });
    },

    async atualizarTokensIPO(token_id, quantidade_tokens) {
        const sqlUpdate = 'UPDATE usuario_tokens SET quantidade_tokens = ? WHERE usuario_id = ? AND token_id = ?';
        
        return new Promise((resolve, reject) => {
            pool.promise().execute(sqlUpdate, [quantidade_tokens, 1, token_id])
                .then((results) => {
                    logger.info(`Atualizando os Pins do IPO, pin ${token_id}, quantidade ${quantidade_tokens}`);
                    resolve(results);
                })
                .catch((error) => {
                    logger.error(`Erro ao executar update:`, error);
                    reject(new Error('Erro ao executar update'));
                });
        });
    }
};

module.exports = AtualizarQuantidadeTokensModel;

