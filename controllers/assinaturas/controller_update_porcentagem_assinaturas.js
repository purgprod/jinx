const UpdatePorcentagemAssinaturasModel = require('../../models/assinaturas/model_update_porcentagem_assinaturas');
const logger = require('../../logger');

const UpdatePorcentagemAssinaturasController = {
    async updatePorcentagem(req, res) {
        try {
            const { porcentagem_assinatura } = req.body;

            if (!porcentagem_assinatura || isNaN(porcentagem_assinatura)) {
                logger.error('Valor da porcentagem não foi informado ou é inválido');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Porcentagem não informada ou inválida'
                });
            }

            const result = await UpdatePorcentagemAssinaturasModel.updatePorcentagem(porcentagem_assinatura);
            
            if (result.affectedRows > 0) {
                logger.info('Porcentagem atualizada com sucesso');
                return res.status(200).json({
                    message: 'Porcentagem atualizada com sucesso'
                });
            }

            logger.warn('Nenhuma alteração realizada');
            return res.status(200).json({
                message: 'Nenhuma alteração realizada'
            });

        } catch (error) {
            logger.error('Erro ao atualizar porcentagem:', error);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erro ao atualizar porcentagem'
            });
        }
    }
};

module.exports = UpdatePorcentagemAssinaturasController;

