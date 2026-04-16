const connection = require('../../database/database_purg');
const logger = require('../../logger');

class HistoricoPatrimonioModel {

    static async getHistoricoPatrimonio(usuarioId) {
        const query = `
            SELECT
                DATE_FORMAT(data_criacao, '%Y-%m-%d') AS data,
                carteira_dia
            FROM usuarios_dados_financeiros_diarios
            WHERE usuario_id = ?
            ORDER BY data_criacao ASC
        `;
        logger.info(`Recuperando histórico de patrimônio para o usuário ID: ${usuarioId}`);
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            return rows;
        } catch (error) {
            logger.error(`Erro ao buscar histórico de patrimônio para o usuário ID: ${usuarioId} - ${error.message}`);
            throw error;
        }
    }

}

module.exports = HistoricoPatrimonioModel;
