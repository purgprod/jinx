const SolicitacaoCancelamentoDepositoModel = require('../../models/endpoints/model_deposito_registro_cancelamento');
const logger = require('../../logger');

const cancelarDeposito = async (req, res) => {
    const { id } = req.params; 
    const { motivo } = req.body;

    // 1. Validação de presença do motivo
    // Semântica: Um cancelamento sem justificativa dificulta a auditoria e o suporte ao usuário.
    if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "O motivo do cancelamento é obrigatório."
        });
    }

    try {
        // 2. Chamada ao model atualizado com os dois parâmetros
        const result = await SolicitacaoCancelamentoDepositoModel.cancelarSolicitacao(id, motivo.trim());

        // 3. Verificação de efeito (State Machine Guard)
        // Se affectedRows === 0, significa que o ID não existe ou o status_deposito != 'Analisando'
        if (result.affectedRows === 0) {
            logger.warn(`Falha ao cancelar deposito: ID ${id} não encontrado ou já processado.`);
            return res.status(409).json({ 
                success: false, 
                message: "A solicitação não pode ser cancelada. Verifique se o deposito ainda está em análise ou se o ID está correto." 
            });
        }

        // 4. Log e Resposta de Sucesso
        logger.info(`Deposito ID ${id} cancelado pelo sistema. Motivo: ${motivo}`);
        
        return res.status(200).json({ 
            success: true, 
            message: "Deposito cancelado com sucesso." 
        });

    } catch (error) {
        logger.error(`[Controller] Erro ao cancelar deposito ID ${id}:`, error);
        return res.status(500).json({ 
            success: false, 
            message: "Erro interno ao processar o cancelamento no servidor." 
        });
    }
};

module.exports = { cancelarDeposito };
