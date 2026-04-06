const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsuariosProTotalModel {
    
    static async getUsuariosProTotal() {
        const query = `
            SELECT 
                COUNT(assinatura) as assinatura_pro
            FROM users
            WHERE assinatura = "Poppy Pro"
        `;

        logger.info(`Recuperando total de usuários com assinatura Poppy Pro`);
        try {
            const [rows] = await connection.promise().query(query);
            return rows; 
        } catch (error) {
            logger.error(`Erro ao buscar total de assinaturas Poppy Pro: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UsuariosProTotalModel;

