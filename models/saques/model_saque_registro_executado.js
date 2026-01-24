// models/endpoints/model_saque_registro_executado.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const SolicitacaoExecutarSaqueModel = {
    /**
     * Altera o status do saque para 'Cancelado' e registra a justificativa.
     * A cláusula WHERE garante a atomicidade lógica: apenas saques em estado 'Analisando'
     * podem sofrer transição para 'Cancelado'.
     * * @param {number|string} usuario_id - ID do usuário.
     */
    async executarSolicitacao(usuario_id) {
        const query = `
            UPDATE saques 
            SET 
                status_saque = 'Executado',
                motivo = 'Saque realizado com sucesso.'
            WHERE usuario_id = ? 
            AND status_saque = 'Analisando';
        `;

        return new Promise((resolve, reject) => {
            // A ordem no array deve seguir estritamente a ordem dos placeholders '?' na query
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Model Saque] Erro ao executar saque ID ${usuario_id}:`, error);
                    return reject(new Error('Erro interno ao atualizar o status do saque.'));
                }
                
                // Semântica: affectedRows == 0 indica que o ID não existe ou a regra de negócio (Analisando) foi violada.
                if (results.affectedRows === 0) {
                    logger.warn(`[Model Saque] Nenhuma alteração feita no saque ID ${usuario_id}. Possível ID inválido ou status incompatível.`);
                } else {
                    logger.info(`[Model Saque] Saque ID ${usuario_id} executado com sucesso.`);
                }

                resolve(results);
            });
        });
    }
};

module.exports = SolicitacaoExecutarSaqueModel;
