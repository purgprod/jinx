// controllers/ecossistema/controller_buscar_usuarios_basic_total.js

const UsuariosBasicTotalModel = require('../../models/assinaturas/model_buscar_usuarios_basic_total');
const logger = require('../../logger');

class UsuariosBasicTotalController {

    // Endpoint para obter todos os usuários com Poppy Basic
    static async getUsuariosBasicTotal(req, res) {
        try {
            // Busca os dados no model
            const dadosTotal = await UsuariosBasicTotalModel.getUsuariosBasicTotal();
            
            if (!dadosTotal || dadosTotal.length === 0) {
                logger.warn('Nenhum usuário encontrado com assinatura Poppy Basic.');
                return res.status(200).json({ message: 'Nenhum usuário encontrado com assinatura Poppy Basic.' });
            }

            logger.info(`Total de usuários cadastrados com a assinatura Poppy Basic: ${JSON.stringify(dadosTotal, null, 2)}`);
            
            res.status(200).json({
                success: true,
                data: dadosTotal
            });

        } catch (error) {
            logger.error(`Erro ao buscar total de usuários cadastrados com assinatura Poppy Basic: ${error.message}`);
            res.status(500).json({ 
                success: false,
                error: 'Falha ao buscar total de usuários Poppy Basic.',
                errorMessage: error.message
            });
        }
    }
}

module.exports = UsuariosBasicTotalController;

