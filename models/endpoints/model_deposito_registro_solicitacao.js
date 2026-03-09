const connection = require('../../database/database_purg');
const logger = require('../../logger');

const SolicitacaoDepositoModel = {
    async insertSolicitacao(usuario_id, valor_deposito) {
        const query = `
            INSERT INTO depositos (
                usuario_id,
                valor_deposito
            ) VALUES (?, ?);
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id, valor_deposito], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inserir solicitacao de deposito.`, error);
                    reject(new Error('Erro ao inserir solicitacao de deposito'));
                } else {
                    logger.info(`Solicitacao de deposito realizada com sucesso`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = SolicitacaoDepositoModel;
