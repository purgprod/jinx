const mysql = require('mysql2');
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarQuantidadeTokensModel = {
    async atualizarQuantidadeTokens(usuario_id, token_id, quantidade_tokens, conn) {
        const sql = 'INSERT INTO usuario_tokens (usuario_id, token_id, quantidade_tokens) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade_tokens = ?';
        const executor = conn || pool.promise();
        const [results] = await executor.execute(sql, [usuario_id, token_id, quantidade_tokens, quantidade_tokens]);
        logger.info(`Token ${token_id} do usuário ${usuario_id} atualizado com sucesso`);
        return results;
    },

    async gravarTransacao(usuario_id, token_id, quantidade_tokens, conn) {
        const sqlInsert = 'INSERT INTO transacoes (usuario_id, id_token, quantidade_token, valor_transacao, tipo_transacao) VALUES (?, ?, ?, ?, ?)';
        const valorTransacao = quantidade_tokens * 0.01;
        const executor = conn || pool.promise();
        const [results] = await executor.execute(sqlInsert, [usuario_id, token_id, quantidade_tokens, valorTransacao, 'C']);
        logger.info(`Transação gravada com sucesso`);
        return results;
    },

    async atualizarTokensIPO(token_id, quantidade_tokens, conn) {
        const sqlUpdate = 'UPDATE usuario_tokens SET quantidade_tokens = ? WHERE usuario_id = ? AND token_id = ?';
        const executor = conn || pool.promise();
        const [results] = await executor.execute(sqlUpdate, [quantidade_tokens, 1, token_id]);
        logger.info(`Atualizando os Pins do IPO, pin ${token_id}, quantidade ${quantidade_tokens}`);
        return results;
    }
};

module.exports = AtualizarQuantidadeTokensModel;

