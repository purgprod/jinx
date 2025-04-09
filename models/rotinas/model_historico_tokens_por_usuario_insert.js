const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const InvestimentoRendimentoUsuarioInsertModel = {
    /**
     * Insere um novo registro histórico de investimento e rendimento para um usuário
     * @param {Object} params - Parâmetros de insert
     * @param {Number} params.usuario_id - ID do usuário
     * @param {Number} params.carteira_dia - Valor acumulado investido pelo cliente
     * @param {Number} params.rendimento_dia - Valor diário de rendimentos do cliente
     * @returns {Promise<Object>} Uma promessa que resolve com o resultado do insert
     */
    async insertHistorico(params) {
        const query = `
            INSERT INTO usuarios_dados_financeiros_diarios (
                data_criacao,
                usuario_id,
                carteira_dia,
                rendimento_dia
            ) VALUES (?, ?, ?, ?);
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [
                params.data,
                params.usuario_id,
                params.carteira_dia,
                params.rendimento_dia
            ], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inserir histórico para o usuário ${params.usuario_id}:`, error);
                    reject(new Error('Erro ao inserir histórico do usuário'));
                } else {
                    logger.info(`Histórico inserido com sucesso para usuário ${params.usuario_id}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = InvestimentoRendimentoUsuarioInsertModel;
