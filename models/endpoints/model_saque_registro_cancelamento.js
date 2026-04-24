// models/endpoints/model_saque_registro_cancelamento.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const SolicitacaoCancelamentoSaqueModel = {
    /**
     * Altera o status do saque para 'Cancelado' e registra a justificativa.
     * A cláusula WHERE garante a atomicidade lógica: apenas saques em estado 'Processando'
     * podem sofrer transição para 'Cancelado'.
     * * @param {number|string} saqueId - ID primário do saque.
     * @param {string} motivo - Texto descrevendo a razão do cancelamento.
     */
    async cancelarSolicitacao(saqueId, motivo) {
        const query = `
            UPDATE saques 
            SET 
                status_saque = 'Cancelado',
                motivo = ?
            WHERE id = ? 
            AND status_saque = 'Processando';
        `;

        return new Promise((resolve, reject) => {
            // A ordem no array deve seguir estritamente a ordem dos placeholders '?' na query
            connection.query(query, [motivo, saqueId], (error, results) => {
                if (error) {
                    logger.error(`[Model Saque] Erro ao cancelar saque ID ${saqueId}:`, error);
                    return reject(new Error('Erro interno ao atualizar o status do saque.'));
                }
                
                // Semântica: affectedRows == 0 indica que o ID não existe ou a regra de negócio (Analisando) foi violada.
                if (results.affectedRows === 0) {
                    logger.warn(`[Model Saque] Nenhuma alteração feita no saque ID ${saqueId}. Possível ID inválido ou status incompatível.`);
                } else {
                    logger.info(`[Model Saque] Saque ID ${saqueId} cancelado com sucesso. Motivo: ${motivo}`);
                }

                resolve(results);
            });
        });
    }
};

module.exports = SolicitacaoCancelamentoSaqueModel;
