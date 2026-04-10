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
                (SELECT SUM(quantidade_tokens) * 0.01
                 FROM usuario_tokens
                 WHERE usuario_id = ?) AS carteira_dia,
                (SELECT rendimento_diario
                 FROM rendimentos
                 WHERE usuario_id = ?
                 ORDER BY data_criacao DESC
                 LIMIT 1) AS rendimento_dia;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [idUsuario], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar os valores de investimento e rendimento para o usuário ${idUsuario}:`, error);
                    reject(new Error('Erro ao buscar valores do usuário'));
                } else {
                    logger.info(`Resultado da consulta para usuário ${idUsuario}: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);
                    resolve(results[0] || null);
                }
            });
        });
    }
};

module.exports = InvestimentoRendimentoUsuarioModel;
