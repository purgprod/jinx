const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsuariosBasicTotalModel {
    
    static async getUsuariosBasicTotal() {
        const query = `
            SELECT 
                COUNT(assinatura) as assinatura_basic
            FROM users
            WHERE assinatura = "Poppy Basic"
        `;

        logger.info(`Recuperando total de usuários com assinatura Poppy Basic`);
        try {
            const [rows] = await connection.promise().query(query);
            logger.info(`Resposta: ${JSON.stringify(rows)}`);
            return rows; 
        } catch (error) {
            logger.error(`Erro ao buscar total de assinaturas Poppy Basic: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UsuariosBasicTotalModel;

