// models/endpoints/model_deposito_registro_executado.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const SolicitacaoExecutarDepositoModel = {
    /**
     * Altera o status do deposito para 'Cancelado' e registra a justificativa.
     * A cláusula WHERE garante a atomicidade lógica: apenas depositos em estado 'Processando'
     * podem sofrer transição para 'Cancelado'.
     * * @param {number|string} usuario_id - ID do usuário.
     */
    async executarSolicitacao(usuario_id, conn) {
        const query = `
            UPDATE depositos
            SET
                status_deposito = 'Executado',
                motivo = 'Deposito realizado com sucesso.'
            WHERE usuario_id = ?
            AND status_deposito = 'Processando';
        `;

        if (conn) {
            const [results] = await conn.execute(query, [usuario_id]);
            if (results.affectedRows === 0) {
                logger.warn(`[Model Deposito] Nenhuma alteração feita no deposito ID ${usuario_id}. Possível ID inválido ou status incompatível.`);
            } else {
                logger.info(`[Model Deposito] Deposito ID ${usuario_id} executado com sucesso.`);
            }
            return results;
        }

        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Model Deposito] Erro ao executar deposito ID ${usuario_id}:`, error);
                    return reject(new Error('Erro interno ao atualizar o status do deposito.'));
                }

                if (results.affectedRows === 0) {
                    logger.warn(`[Model Deposito] Nenhuma alteração feita no deposito ID ${usuario_id}. Possível ID inválido ou status incompatível.`);
                } else {
                    logger.info(`[Model Deposito] Deposito ID ${usuario_id} executado com sucesso.`);
                }

                resolve(results);
            });
        });
    }
};

module.exports = SolicitacaoExecutarDepositoModel;
