const connection = require('../../database/database_purg');
const logger = require('../../logger');

const NamiBuscarPorCelularModel = {
    async buscarPorCelular(celular) {
        const query = `
            SELECT usuario_id
            FROM users
            WHERE celular = ?
            LIMIT 1
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [celular], (error, results) => {
                if (error) {
                    logger.error(`[Nami] Erro ao buscar usuário pelo celular ${celular}:`, error);
                    return reject(error);
                }
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    },
};

module.exports = NamiBuscarPorCelularModel;
