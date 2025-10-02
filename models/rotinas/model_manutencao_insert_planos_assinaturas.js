const connection = require('../../database/database_purg');
const logger = require('../../logger');

const PlanosAssinaturasInsertModel = {
    async insertPlanos(poppy_basic, poppy_pro) {
        const query = `
            INSERT INTO planos_historico (
                poppy_basic,
                poppy_pro
            ) VALUES (?, ?);
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [poppy_basic, poppy_pro], (error, results) => {
                if (error) {
                    logger.error(`Erro ao inserir histórico de planos das assinaturas.`, error);
                    reject(new Error('Erro ao inserir histórico de planos das assinaturas'));
                } else {
                    logger.info(`Histórico de planos das assinaturas inserido com sucesso`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = PlanosAssinaturasInsertModel;
