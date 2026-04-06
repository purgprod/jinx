const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarUsuariosAssinaturasModel = {
    async getPlanos(usuario_id) {
        const sqlQuery = `SELECT assinatura
        FROM users
        WHERE usuario_id = ?
        ;`
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar assinaturas dos usuários:', error);
                    reject(new Error('Erro ao buscar assinaturas dos usuários'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarUsuariosAssinaturasModel;

