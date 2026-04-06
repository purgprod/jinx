const mysql = require('mysql2');
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class RendimentosUsuarioModel {

    // Método para obter os rendimentos do usuário
    static async getRendimentosUsuario(usuarioId) {
        const query = `
	SELECT
	    SUM(rendimento_diario) OVER() AS rendimento_total,
	    rendimento_diario AS ultimo_rendimento
	FROM rendimentos
	WHERE usuario_id = ?
	ORDER BY data_criacao DESC
	LIMIT 1;
        `;
        logger.info(`Recuperando os valor de rendimentos para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Rendimentos encontrados para o usuário ID: ${usuarioId}`);
                return rows[0];
            } else {
                logger.warn(`Nenhum rendimento encontrado para o usuário ID: ${usuarioId}`);
                return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar rendimentos para o usuário com ID: ${usuarioId} - ${error.message}`);
            throw error;
        }
    }

}

module.exports = RendimentosUsuarioModel;
