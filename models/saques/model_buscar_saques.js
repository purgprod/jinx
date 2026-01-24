// models/saques/model_buscar_saques.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarSaquesModel = {
    async getSaques() {
        const sqlQuery = `
            SELECT 
                s.id, 
                s.data_criacao, 
                s.usuario_id, 
                u.nome_completo, 
                u.email, 
                s.valor_saque, 
                s.chave_pix, 
                s.status_saque 
            FROM saques s
            INNER JOIN users u ON s.usuario_id = u.usuario_id
	    AND status_saque = 'Analisando'
        `;
        
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar saques:', error);
                    reject(new Error('Erro ao buscar saques'));
                } else {
                    logger.info(`Saques encontrados: ${results.length} registro(s)`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarSaquesModel;

