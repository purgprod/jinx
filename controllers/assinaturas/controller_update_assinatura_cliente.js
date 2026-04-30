const UpdateAssinaturaClienteModel = require('../../models/assinaturas/model_update_assinatura_cliente');
const logger = require('../../logger');

const UpdateAssinaturaClienteController = {
    async updateAssinaturaCliente(req, res) {
        try {
            // Extrai o ID do usuário dos parâmetros da URL
            const { id } = req.params;
            
            // Extrai a nova assinatura do corpo da requisição
            const { novaAssinatura } = req.body;

            if (!id || isNaN(id)) {
                logger.error('Usuário não foi informado ou é inválido');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Usuário não informado ou inválido'
                });
            }

            if (!novaAssinatura || typeof novaAssinatura !== 'string' || novaAssinatura.trim() === '') {
                logger.error('Nova assinatura não foi informada ou é inválida');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Nova assinatura não informada ou inválida'
                });
            }

            const usuario_id = parseInt(id, 10);

            if (isNaN(usuario_id)) {
                logger.error('O ID do usuário não é um número válido');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'O ID do usuário não é um número válido'
                });
            }

            const result = await UpdateAssinaturaClienteModel.updateAssinatura(novaAssinatura, usuario_id);
            
            if (result.affectedRows > 0) {
                logger.info(`Assinatura do usuário ${usuario_id} atualizada com sucesso`);
                return res.status(200).json({ message: 'Assinatura atualizada com sucesso' });
            }

            logger.warn(`Nenhuma alteração realizada na assinatura do usuário ${usuario_id}`);
            return res.status(200).json({
                message: 'Nenhuma alteração realizada'
            });

        } catch (error) {
            logger.error(`Erro ao atualizar assinatura do usuário: ${error.message}`);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erro ao atualizar assinatura do usuário'
            });
        }
    }
};

module.exports = UpdateAssinaturaClienteController;

