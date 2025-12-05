const connection = require('../../database/database_purg');
const logger = require('../../logger');

const SolicitacaoSaqueModel = {
    async insertSolicitacao(usuario_id, valor_saque, chave_pix) {
        const query = `
            INSERT INTO saques (
                usuario_id,
                valor_saque,
		chave_pix
            ) VALUES (?, ?, ?);
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id, valor_saque, chave_pix], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inserir solicitacao sa saque.`, error);
                    reject(new Error('Erro ao inserir solicitacao de saque'));
                } else {
                    logger.info(`Solicitacao de saque realizada com sucesso`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = SolicitacaoSaqueModel;
