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
                (SELECT SUM(ut.quantidade_tokens) * 0.01
                 FROM usuario_tokens ut
                 WHERE ut.usuario_id = ?) AS carteira_dia,
                (SELECT rendimento_diario
                 FROM rendimentos
                 WHERE usuario_id = ?
                 ORDER BY data_criacao DESC
                 LIMIT 1) AS rendimento_dia,
                (SELECT SUM(ut.quantidade_tokens) * 0.01
                 FROM usuario_tokens ut
                 INNER JOIN tokens t ON ut.token_id = t.id_token
                 WHERE ut.usuario_id = ?
                   AND t.risco = 'EMB') AS emblemas_dia;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [idUsuario, idUsuario, idUsuario], (error, results) => {
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
