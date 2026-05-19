const logger                    = require('../../logger');
const BuscarExpiradosModel      = require('../../models/depositos/model_deposito_buscar_expirados');
const CancelarDepositoModel     = require('../../models/endpoints/model_deposito_registro_cancelamento');

const MOTIVO = 'Pix expirado automaticamente após 60 minutos.';

const CancelarDepositosExpiradosController = {
    async executar(_req, res) {
        res.status(200).json({ message: 'Rotinas executadas com sucesso' });

        try {
            const expirados = await BuscarExpiradosModel.buscarExpirados();

            if (!expirados.length) {
                logger.info('[Depositos] Nenhum PIX expirado encontrado.');
                return;
            }

            let cancelados = 0;
            for (const deposito of expirados) {
                try {
                    await CancelarDepositoModel.cancelarSolicitacao(deposito.id, MOTIVO);
                    cancelados++;
                } catch (err) {
                    logger.error(`[Depositos] Erro ao cancelar depósito expirado id=${deposito.id}`, { erro: err.message });
                }
            }

            logger.info(`[Depositos] PIX expirados cancelados: ${cancelados}/${expirados.length}`);
        } catch (err) {
            logger.error('[Depositos] Erro ao buscar PIX expirados', { erro: err.message });
        }
    },
};

module.exports = CancelarDepositosExpiradosController;
