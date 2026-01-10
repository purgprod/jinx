const mysql = require('mysql2');
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class DadosEmpresaModel {

    // Método para obter os dados cadastrais da empresa
    static async getDadosEmpresa(id_empresa) {
        const query = `
            SELECT * 
            FROM resultados_financeiros rf
	    INNER JOIN tokens t
	    ON rf.id_resultado = id_token
            WHERE rf.id_resultado = ?
        `;
        logger.info(`Recuperando os valor de dados cadastrais para a empresa ID: ${id_empresa}`);
        try {
            const [rows] = await connection.promise().query(query, [id_empresa]);
            if (rows.length > 0) {
                logger.info(`Dados cadastrais encontrados para a empresa ID: ${id_empresa}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return rows[0];
            } else {
                logger.warn(`Nenhum dado cadastral encontrado para a empresa ID: ${id_empresa}`);
                logger.info(`Resposta: ${JSON.stringify(rows)}`);
                return null;
            }
        } catch (error) {
            logger.error(`Erro ao buscar dados cadastrais para o empresa com ID: ${id_empresa} - ${error.message}`);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
            throw error;
        }
    }

}

module.exports = DadosEmpresaModel;
