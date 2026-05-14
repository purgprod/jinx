// controllers/endpoints/controller_buscar_depositos_pendentes_usuario.js
const BuscarDepositoPendenteModel = require('../../models/endpoints/model_deposito_buscar_deposito_pendente_usuario');
const CancelarDepositoModel       = require('../../models/endpoints/model_deposito_registro_cancelamento');
const logger = require('../../logger');

const PIX_EXPIRACAO_SEGUNDOS = 3600;

const BuscarDepositosPendentesUsuarioController = {
    async getDepositosPendentes(req, res) {
        // A desestruturação busca exatamente o nome definido na rota (:id)
        const { id } = req.params;

        // Fail-fast: Validação de presença e tipo básico
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ 
                error: 'O parâmetro id é obrigatório e deve ser um identificador válido.' 
            });
        }

        logger.info(`Iniciando busca de depositos pendentes para id: ${id}`);

        try {
            const depositos = await BuscarDepositoPendenteModel.getDepositoPendente(id);

            const ativos = [];
            for (const dep of depositos) {
                const criadoEm   = new Date(dep.data_criacao).getTime();
                const expiradoEm = criadoEm + PIX_EXPIRACAO_SEGUNDOS * 1000;

                if (Date.now() > expiradoEm) {
                    logger.info(`PIX expirado cancelado automaticamente via busca (depositoId=${dep.id}, userId=${id})`);
                    await CancelarDepositoModel.cancelarSolicitacao(dep.id, 'PIX expirado automaticamente');
                } else {
                    ativos.push({
                        ...dep,
                        expiracao_restante: Math.max(0, Math.floor((expiradoEm - Date.now()) / 1000)),
                    });
                }
            }

            logger.info(`Busca finalizada para user ${id}: ${ativos.length} registros ativos encontrados.`);
            return res.status(200).json(ativos);
            
        } catch (error) {
            // Log detalhado para debug interno, mas mensagem genérica para o cliente (segurança)
            logger.error(`Erro crítico na query de depositos (User: ${id}):`, error.message);
            return res.status(500).json({ error: 'Erro interno ao processar a consulta de depositos.' });
        }
    }
};

module.exports = BuscarDepositosPendentesUsuarioController;
