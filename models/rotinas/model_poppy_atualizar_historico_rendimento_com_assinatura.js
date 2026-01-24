// models/rotinas/model_poppy_atualizar_historico_rendimento_com_assinatura.js
const db = require('../../database/database_purg');
const logger = require('../../logger');

const AtualizarHistoricoRendimentoModel = {
    /**
     * Atualiza o valor do rendimento diário para o valor líquido (após desconto).
     * @param {number} id - ID do registro na tabela rendimentos.
     * @param {number} rendimentoAtualizado - Valor calculado (Rendimento - Assinatura).
     */
    async updateRendimentoComAssinatura(id, rendimentoAtualizado) {
        const sqlQuery = `
            UPDATE rendimentos 
            SET rendimento_diario = ? 
            WHERE id = ?
        `;

        try {
            // .promise() garante que o await funcione e não dispare o erro de callback
            const [result] = await db.promise().query(sqlQuery, [rendimentoAtualizado, id]);

            if (result.affectedRows === 0) {
                logger.warn(`Aviso: Nenhuma linha atualizada no histórico de rendimento. ID: ${id}`);
            }

            return result;
        } catch (error) {
            logger.error(`[Model: AtualizarHistoricoRendimento] Erro ao atualizar registro ${id}: ${error.message}`, {
                id,
                rendimentoAtualizado
            });
            throw new Error('Falha ao atualizar o histórico de rendimento no banco de dados.');
        }
    }
};

module.exports = AtualizarHistoricoRendimentoModel;
