// models/rotinas/model_poppy_buscar_assinaturas.js
const connection = require('../../database/database_usuarios');
const logger = require('../../logger');

const BuscarAssinaturaModel = {
    async getAssinatura(data = null) {
        const sqlQuery = `SELECT assinatura
        FROM users
        WHERE usuario_id = ?`;

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [data], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar assinatura do usuário:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    reject(new Error('Erro ao buscar assinatura do usuário'));
                } else {
                    resolve(results);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarAssinaturaModel;

