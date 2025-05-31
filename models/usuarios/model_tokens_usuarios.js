const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class UsersTokensModel {

    // Método para buscar tokens associados a um usuário
    static async tokensUsuario(usuarioId) {
        const query = `
            SELECT u.*, t.razao_social, t.risco, t.valor_token, t.rendimento_token, t.vencimento, t.dias_vencimento
            FROM usuario_tokens u
            INNER JOIN tokens t
            ON u.token_id = t.id_token
            WHERE usuario_id = ?
	    AND u.quantidade_tokens != 0
        `;
        logger.info(`Recuperando tokens para o usuário com ID: ${usuarioId}`);

        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Tokens encontrados para o usuário com ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    } else {
                logger.warn(`Nenhum token encontrado para o usuário com ID: ${usuarioId}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    }
            return rows;
        } catch (error) {
            logger.error(`Erro ao buscar tokens para o usuário com ID: ${usuarioId} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    throw error;
        }
    }
}

module.exports = UsersTokensModel;

