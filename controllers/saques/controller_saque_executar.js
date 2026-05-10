// controllers/saques/controller_saque_executar.js
// Baixa manual de saque via painel Jinx.
//
// O Pix já foi enviado pelo admin por fora (ou via outro canal).
// Este controller apenas confirma a liquidação: muda o status de
// "Processando" para "Executado" sem acionar a Efí Bank.
//
// Importante: NÃO debita a carteira novamente — isso já foi feito
// pelo fluxo do usuário.

const logger = require('../../logger');
const BuscarSaqueParaEnvioModel   = require('../../models/saques/model_saque_buscar_para_envio');
const ExecutarSolicitacaoModel    = require('../../models/saques/model_saque_registro_executado');

const ExecutarSaqueController = {
    async execute(req, res) {
        const { id } = req.params; // usuario_id

        try {
            // 1. Verifica se existe saque "Processando" para o usuário
            const saque = await BuscarSaqueParaEnvioModel.getSaqueParaEnvio(id);

            if (!saque) {
                logger.warn('Nenhum saque "Processando" encontrado para baixa', { userId: id });
                return res.status(404).json({
                    error: 'Nenhum saque pendente encontrado para este usuário.'
                });
            }

            // 2. Marca o saque como "Executado" diretamente
            await ExecutarSolicitacaoModel.executarSolicitacao(id);

            logger.info('Saque baixado manualmente com sucesso', {
                userId:  id,
                saqueId: saque.id,
                valor:   saque.valor_saque
            });

            return res.status(200).json({
                success: true,
                message: 'Saque baixado com sucesso.',
                data: {
                    usuario_id:    id,
                    saque_id:      saque.id,
                    valor_enviado: saque.valor_saque,
                    chave_pix:     saque.chave_pix,
                    status:        'Executado'
                }
            });

        } catch (err) {
            logger.error('Erro inesperado na baixa manual do saque', { userId: id, error: err.message });
            return res.status(500).json({ error: 'Erro interno ao baixar o saque.' });
        }
    }
};

module.exports = ExecutarSaqueController;
