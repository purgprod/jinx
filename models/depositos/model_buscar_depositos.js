// models/depositos/model_buscar_depositos.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarDepositosModel = {
    async getDepositos() {
        const sqlQuery = `
            SELECT 
                d.id, 
                d.data_criacao, 
                d.usuario_id, 
                u.nome_completo, 
                u.email, 
                d.valor_deposito, 
                d.status_deposito 
            FROM depositos d
            INNER JOIN users u ON d.usuario_id = u.usuario_id
        `;
        
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar depositos:', error);
                    reject(new Error('Erro ao buscar depositos'));
                } else {
                    logger.info(`Depositos encontrados: ${results.length} registro(s)`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarDepositosModel;

