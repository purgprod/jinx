// controllers/saques/controller_saque_executar.js
// Retry manual de saque via painel Jinx.
//
// Usado apenas quando o envio automático do Pix falhou na solicitação
// do usuário (ETAPA 9 do controller_saque.js). O saque permanece em
// status "Analisando" e o admin pode reprocessá-lo aqui.
//
// Importante: NÃO debita a carteira novamente — isso já foi feito
// pelo fluxo do usuário. Este controller apenas reenvia o Pix.

const logger = require('../../logger');
const BuscarSaqueParaEnvioModel = require('../../models/saques/model_saque_buscar_para_envio');
const AtualizarSaqueE2eModel    = require('../../models/saques/model_saque_atualizar_e2e');
const { enviarPix }             = require('../../services/efi_pix');

const ExecutarSaqueController = {
    async execute(req, res) {
        const { id } = req.params; // usuario_id

        try {
            // 1. Busca o saque "Analisando" pendente de envio do Pix
            const saque = await BuscarSaqueParaEnvioModel.getSaqueParaEnvio(id);

            if (!saque) {
                logger.warn('Nenhum saque "Analisando" encontrado para reprocessamento', { userId: id });
                return res.status(404).json({
                    error: 'Nenhum saque pendente de reprocessamento encontrado para este usuário.'
                });
            }

            // 2. Reenvia o Pix via Efí Bank
            let pixEnviado;
            try {
                pixEnviado = await enviarPix({
                    chaveDestino: saque.chave_pix,
                    valor:        Number(saque.valor_saque).toFixed(2),
                    descricao:    `Saque Purg #${saque.id} (retry)`
                });
            } catch (errPix) {
                logger.error('Falha no reenvio do Pix via Efí Bank', { userId: id, saqueId: saque.id, erro: errPix.message });
                return res.status(502).json({ error: 'Falha ao reenviar o Pix. Tente novamente.' });
            }

            // 3. Registra o endToEndId e muda status para "Processando"
            await AtualizarSaqueE2eModel.atualizarE2e(saque.id, pixEnviado.endToEndId);

            logger.info('Saque reprocessado com sucesso via Efí Bank', {
                userId:     id,
                saqueId:    saque.id,
                endToEndId: pixEnviado.endToEndId
            });

            return res.status(200).json({
                success: true,
                message: 'Pix reenviado. O saque será confirmado automaticamente pelo Efí Bank.',
                data: {
                    usuario_id:    id,
                    saque_id:      saque.id,
                    valor_enviado: saque.valor_saque,
                    chave_pix:     saque.chave_pix,
                    end_to_end_id: pixEnviado.endToEndId,
                    status:        'Processando'
                }
            });

        } catch (err) {
            logger.error('Erro inesperado no reprocessamento de saque', { userId: id, error: err.message });
            return res.status(500).json({ error: 'Erro interno ao reprocessar o saque.' });
        }
    }
};

module.exports = ExecutarSaqueController;
