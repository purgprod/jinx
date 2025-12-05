// models/saques/model_cancelar_saques.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const CancelarSaquesModel = {
    async updateCancelarSaques() {
        const sqlQuery = `
            SELECT 
                s.id, 
                s.data_criacao,
                s.usuario_id, 
		u.nome_completo,
                u.email, 
                s.valor_saque, 
                s.status_saque 
            FROM saques s
            INNER JOIN users u ON s.usuario_id = u.usuario_id
        `;
        
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error(`Erro ao cancelar saques do id: ${id}`, error);
                    reject(new Error(`Erro ao cancelar saque do id: ${id}`));
                } else {
                    logger.info(`Saque de id ${id} foi cancelado com sucesso: ${results.length}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = CancelarSaquesModel;

