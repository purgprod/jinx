const connection = require('../../database/database_purg');
const logger = require('../../logger');

const InvestimentoRendimentoUsuarioModel = {
    /**
     * Busca os valores de investimento e rendimento diário de um usuário específico
     * @param {Number} idUsuario - ID do usuário
     * @returns {Promise<Object>} Uma promessa que resolve com os valores do usuário
     */
    async getValoresByUsuarioId(idUsuario) {
        const query = `
            SELECT 
                SUM(quantidade_tokens) * 0.01 AS carteira_dia,
                SUM(rendimento_token) AS rendimento_dia
            FROM 
                usuario_tokens
            WHERE 
                usuario_id = ?;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [idUsuario], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar os valores de investimento e rendimento para o usuário ${idUsuario}:`, error);
                    reject(new Error('Erro ao buscar valores do usuário'));
                } else {
                    logger.info(`Resultado da consulta para usuário ${idUsuario}: ${JSON.stringify(results)}`);
                    resolve(results[0] || null);
                }
            });
        });
    }
};

module.exports = InvestimentoRendimentoUsuarioModel;
