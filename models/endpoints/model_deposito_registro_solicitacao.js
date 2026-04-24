const connection = require('../../database/database_purg');
const logger = require('../../logger');

const SolicitacaoDepositoModel = {
    async insertSolicitacao(usuario_id, valor_deposito) {
        const query = `
            INSERT INTO depositos (
                usuario_id,
                valor_deposito,
                txid,
                qr_code,
                pix_copia_cola
            ) VALUES (?, ?, NULL, NULL, NULL);
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id, valor_deposito], (error, results) => {
                if (error) {
                    logger.error('Erro ao inserir solicitacao de deposito.', error);
                    reject(new Error('Erro ao inserir solicitacao de deposito'));
                } else {
                    logger.info('Solicitacao de deposito registrada com sucesso');
                    resolve(results);
                }
            });
        });
    },

    async deleteSolicitacao(depositoId) {
        const query = `DELETE FROM depositos WHERE id = ? AND status_deposito = 'Processando';`;

        return new Promise((resolve, reject) => {
            connection.query(query, [depositoId], (error, results) => {
                if (error) {
                    logger.error(`Erro ao remover solicitação de depósito ID ${depositoId}.`, error);
                    reject(new Error('Erro ao remover solicitação de depósito'));
                } else {
                    logger.info(`Solicitação de depósito ID ${depositoId} removida com sucesso`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = SolicitacaoDepositoModel;
