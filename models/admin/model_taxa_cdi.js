const connection = require('../../database/database_purg');
const logger = require('../../logger');

const TaxaCdiModel = {
    async buscar() {
        const query = 'SELECT valor, proxima_reuniao_copom, atualizado_em FROM taxa_cdi WHERE id = 1';
        return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    logger.error('[Admin] Erro ao buscar taxa CDI:', error);
                    return reject(new Error('Erro ao buscar taxa CDI.'));
                }
                resolve(results[0] ?? null);
            });
        });
    },

    async atualizar(valor, proximaReuniaoCopom) {
        const query = 'UPDATE taxa_cdi SET valor = ?, proxima_reuniao_copom = ? WHERE id = 1';
        return new Promise((resolve, reject) => {
            connection.query(query, [valor, proximaReuniaoCopom ?? null], (error, results) => {
                if (error) {
                    logger.error('[Admin] Erro ao atualizar taxa CDI:', error);
                    return reject(new Error('Erro ao atualizar taxa CDI.'));
                }
                resolve(results.affectedRows);
            });
        });
    },
};

module.exports = TaxaCdiModel;
