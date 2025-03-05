const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

class EcossistemaUltimosDadosFinanceirosModel {
    
// Método para obter o valor mais recente da carteira do ecossistema
    static async getUltimosDadosFinanceiros(usuarioId) {
        const query = `
            SELECT carteira_dia, rendimento_dia 
            FROM usuarios_dados_financeiros_diarios 
            WHERE usuario_id != ?
            ORDER BY data_criacao DESC 
            LIMIT 1
        `;
        logger.info(`Recuperando os últimos dados financeiros para o ecossistema`);

        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            if (rows.length > 0) {
                logger.info(`Últimos dados financeiros encontrados para o ecossistema`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return rows[0];
            } else {
                logger.warn(`Nenhum dado financeiro encontrado para o ecossistema`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
		return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar últimos dados financeiros para o ecossistema: ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
	    throw error;
        }
    }
}

module.exports = EcossistemaUltimosDadosFinanceirosModel;

