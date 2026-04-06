const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class EcossistemaDadosRendimentosHistoricosModel {
    
    // Método para obter todos os dados de rendimentos históricos do Ecossistema
    static async getDadosRendimentosHistoricos(usuarioId) {
        const query = `
        SELECT
	  data_criacao,
	  SUM(rendimento_dia) AS rendimento_dia
	FROM usuarios_dados_financeiros_diarios
	WHERE usuario_id != ?
	GROUP BY data_criacao
	ORDER BY data_criacao;
        `;
        
        logger.info(`Recuperando dados de rendimentos históricos para o ecossistema`);
        
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            return rows; // Retorna todos os dados financeiros históricos
        } catch (error) {
            logger.error(`Erro ao buscar dados de rendimentos históricos para o Ecossistema: ${error.message}`);
            throw error; // Apenas lançamos o erro
        }
    }
}

module.exports = EcossistemaDadosRendimentosHistoricosModel;

