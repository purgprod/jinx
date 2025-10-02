// models/rotinas/model_poppy_buscar_emblemas_carteiras.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarEmblemasCarteirasModel = {
    async getEmblemasCarteiras(usuario_id) {
        const sqlQuery = `SELECT emblemas
        FROM carteiras
        WHERE usuario_id = ? 
        AND status_ativo = 1`; // Removi o ponto e vírgula aqui, pois não é necessário

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => { // Passei usuario_id como parâmetro
                if (error) {
                    logger.error('Erro ao buscar emblemas das carteiras:', error);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    reject(new Error('Erro ao buscar emblemas das carteiras'));
                } else {
                    resolve(results);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                }
            });
        });
    }
};

module.exports = BuscarEmblemasCarteirasModel;

