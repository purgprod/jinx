const connection = require('../../database/database_purg');
const logger = require('../../logger');

const NamiToggleModel = {
    async setAtivo(usuario_id, ativo) {
        const query = `UPDATE users SET nami_ativo = ? WHERE usuario_id = ?`;
        return new Promise((resolve, reject) => {
            connection.query(query, [ativo ? 1 : 0, usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Nami] Erro ao atualizar nami_ativo usuario_id=${usuario_id}:`, error);
                    return reject(new Error('Erro ao atualizar configuração da Nami.'));
                }
                resolve(results.affectedRows);
            });
        });
    },

    async getAtivo(usuario_id) {
        const query = `SELECT nami_ativo FROM users WHERE usuario_id = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) return reject(error);
                if (!results.length) return resolve(null);
                resolve(results[0].nami_ativo === 1);
            });
        });
    },
};

module.exports = NamiToggleModel;
