const connection = require('../../database/database_purg');
const logger = require('../../logger');

const RotinasInativarPinsModel = {
    async inativarPins(id_token) {
        const sqlQuery = `UPDATE tokens 
                SET status_ativo = 0 
                WHERE id_token = ?;`;
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id_token], (error, results) => {
                if (error) {
                    logger.error('Erro ao inativar o Pin:', error);
                    reject(new Error('Erro ao atualizar última execução'));
                } else {
                    logger.info(`Rotina de inativação realizada com sucesso para o Pin: ${id_token}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = RotinasInativarPinsModel;

