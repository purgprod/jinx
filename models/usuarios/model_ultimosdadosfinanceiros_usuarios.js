const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class UsersUltimosDadosFinanceirosModel {
    
// Método para obter o valor mais recente da carteira e rendimento do usuário
    static async getUltimosDadosFinanceiros(usuarioId) {
        const query = `
        SELECT 
	    c.investido, 
	    SUM(rendimento_token) AS rendimento_token
	FROM carteiras c
	INNER JOIN usuario_tokens u
	ON c.usuario_id = u.usuario_id
	WHERE u.usuario_id = ?
	GROUP BY c.investido;
	    `;
        logger.info(`Recuperando os últimos dados financeiros para o usuário ID: ${usuarioId}`);

        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Últimos dados financeiros encontrados para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return rows[0];
            } else {
                logger.warn(`Nenhum dado financeiro encontrado para o usuário ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar últimos dados financeiros para o usuário com ID: ${usuarioId} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    throw error;
        }
    }
}

module.exports = UsersUltimosDadosFinanceirosModel;

