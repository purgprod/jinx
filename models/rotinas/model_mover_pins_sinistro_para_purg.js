const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger');

const MoverPinsSinistroModel = {
    async moverPinsSinistro(id_token) {
        const sqlQuery = `UPDATE usuario_tokens 
                SET quantidade_tokens = ?,
		    rendimento_tokens = ?
                WHERE id_token = ?
		AND usuario_id = 1
		;`;
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id_token], (error, results) => {
                if (error) {
                    logger.error('Erro ao mover o Pin dos usuários para a Purg:', error);
                    reject(new Error('Erro ao atualizar última execução'));
                } else {
                    logger.info(`Quantidade de tokens e rendimentos movidos dos clientes para a Purg referente o Pin em sinistro: ${id_token}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = MoverPinsSinistroModel;

