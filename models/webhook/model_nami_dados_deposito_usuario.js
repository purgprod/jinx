const connection = require('../../database/database_purg');
const logger = require('../../logger');

const NamiDadosDepositoUsuarioModel = {
    async buscarPorId(usuario_id) {
        const query = `
            SELECT usuario_id, cpf, nome_completo
            FROM users
            WHERE usuario_id = ?
            LIMIT 1
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Nami] Erro ao buscar dados do usuário id=${usuario_id}:`, error);
                    return reject(error);
                }
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    },
};

module.exports = NamiDadosDepositoUsuarioModel;
