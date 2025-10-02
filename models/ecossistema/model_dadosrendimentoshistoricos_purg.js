const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class PurgDadosRendimentosHistoricosModel {
    
    // Método para obter todos os dados de rendimentos históricos da Purg
    static async getDadosRendimentosHistoricos(usuarioId) {
        const query = `
            SELECT data_criacao, rendimento_dia
            FROM usuarios_dados_financeiros_diarios
            WHERE usuario_id = ?
            ORDER BY data_criacao ASC
        `;
        
        logger.info(`Recuperando dados de rendimentos históricos para a Purg`);
        
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            logger.info(`Resposta: ${JSON.stringify(rows)}`); // Logando a resposta aqui, após `rows` ser definido
            return rows; // Retorna todos os dados financeiros históricos
        } catch (error) {
            logger.error(`Erro ao buscar dados de rendimentos históricos para a Purg: ${error.message}`);
            throw error; // Apenas lançamos o erro
        }
    }
}

module.exports = PurgDadosRendimentosHistoricosModel;

