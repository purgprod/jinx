const connection = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarCarteiraSaqueModel = {
    async updateCarteira(novo_valor, usuario_id) {
        // Certifica-se que o novo_valor é uma string com até 8 casas decimais
        const formattedValue = parseFloat(novo_valor).toFixed(8);
        
        const query = `
            UPDATE carteiras 
            SET saldo = ? 
            WHERE usuario_id = ?;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [formattedValue, usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao atualizar o saldo da carteira.`, { error, novo_valor, usuario_id });
                    reject(new Error('Erro ao atualizar o saldo da carteira'));
                } else {
                    logger.info(`Saldo da carteira atualizado com sucesso no banco de dados para o ${usuario_id}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = AtualizarCarteiraSaqueModel;

