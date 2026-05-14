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
    async executarSolicitacao(depositoId, conn) {
        const query = `
            UPDATE depositos
            SET
                status_deposito = 'Executado',
                motivo = 'Deposito realizado com sucesso.'
            WHERE id = ?
            AND status_deposito = 'Processando';
        `;

        if (conn) {
            const [results] = await conn.execute(query, [depositoId]);
            if (results.affectedRows === 0) {
                logger.warn(`[Model Deposito] Nenhuma alteração feita no deposito ID ${depositoId}. Possível ID inválido ou status incompatível.`);
            } else {
                logger.info(`[Model Deposito] Deposito ID ${depositoId} executado com sucesso.`);
            }
            return results;
        }

        return new Promise((resolve, reject) => {
            connection.query(query, [depositoId], (error, results) => {
                if (error) {
                    logger.error(`[Model Deposito] Erro ao executar deposito ID ${depositoId}:`, error);
                    return reject(new Error('Erro interno ao atualizar o status do deposito.'));
                }

                if (results.affectedRows === 0) {
                    logger.warn(`[Model Deposito] Nenhuma alteração feita no deposito ID ${depositoId}. Possível ID inválido ou status incompatível.`);
                } else {
                    logger.info(`[Model Deposito] Deposito ID ${depositoId} executado com sucesso.`);
                }

                resolve(results);
            });
        });
    }
};

module.exports = SolicitacaoExecutarDepositoModel;
