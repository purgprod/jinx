// models/endpoints/model_deposito_registro_cancelamento.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const SolicitacaoCancelamentoDepositoModel = {
    /**
     * Altera o status do deposito para 'Cancelado' e registra a justificativa.
     * A cláusula WHERE garante a atomicidade lógica: apenas depositos em estado 'Processando'
     * podem sofrer transição para 'Cancelado'.
     * * @param {number|string} depositoId - ID primário do deposito.
     * @param {string} motivo - Texto descrevendo a razão do cancelamento.
     */
    async cancelarSolicitacao(depositoId, motivo) {
        const query = `
            UPDATE depositos 
            SET 
                status_deposito = 'Cancelado',
                motivo = ?
            WHERE id = ? 
            AND status_deposito = 'Processando';
        `;

        return new Promise((resolve, reject) => {
            // A ordem no array deve seguir estritamente a ordem dos placeholders '?' na query
            connection.query(query, [motivo, depositoId], (error, results) => {
                if (error) {
                    logger.error(`[Model Deposito] Erro ao cancelar deposito ID ${depositoId}:`, error);
                    return reject(new Error('Erro interno ao atualizar o status do deposito.'));
                }
                
                // Semântica: affectedRows == 0 indica que o ID não existe ou a regra de negócio (Analisando) foi violada.
                if (results.affectedRows === 0) {
                    logger.warn(`[Model Deposito] Nenhuma alteração feita no deposito ID ${depositoId}. Possível ID inválido ou status incompatível.`);
                } else {
                    logger.info(`[Model Deposito] Deposito ID ${depositoId} cancelado com sucesso. Motivo: ${motivo}`);
                }

                resolve(results);
            });
        });
    }
};

module.exports = SolicitacaoCancelamentoDepositoModel;
