const connection = require('../../database/database_purg');
const logger = require('../../logger');

class HistoricoRendimentosModel {

    static async getHistoricoRendimentos(usuarioId) {
        const query = `
            SELECT
                DATE_FORMAT(data_criacao, '%Y-%m-%d') AS data,
                rendimento_dia
            FROM usuarios_dados_financeiros_diarios
            WHERE usuario_id = ?
            ORDER BY data_criacao ASC
        `;
        logger.info(`Recuperando histórico de rendimentos para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            return rows;
        } catch (error) {
            logger.error(`Erro ao buscar histórico de rendimentos para o usuário ID: ${usuarioId} - ${error.message}`);
            throw error;
        }
    }

}

module.exports = HistoricoRendimentosModel;
