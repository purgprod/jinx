// controllers/ecossistema/controller_buscar_usuarios_pro_total.js

const UsuariosProTotalModel = require('../../models/assinaturas/model_buscar_usuarios_pro_total');
const logger = require('../../logger');

class UsuariosProTotalController {

    // Endpoint para obter todos os usuários com Poppy Pro
    static async getUsuariosProTotal(req, res) {
        try {
            // Busca os dados no model
            const dadosTotal = await UsuariosProTotalModel.getUsuariosProTotal();
            
            if (!dadosTotal || dadosTotal.length === 0) {
                logger.warn('Nenhum usuário encontrado com assinatura Poppy Pro.');
                return res.status(200).json({ message: 'Nenhum usuário encontrado com assinatura Poppy Pro.' });
            }

            logger.info(`Total de usuários cadastrados com a assinatura Poppy Pro: ${JSON.stringify(dadosTotal, null, 2)}`);
            
            res.status(200).json({
                success: true,
                data: dadosTotal
            });

        } catch (error) {
            logger.error(`Erro ao buscar total de usuários cadastrados com assinatura Poppy Pro: ${error.message}`);
            res.status(500).json({ 
                success: false,
                error: 'Falha ao buscar total de usuários Poppy Pro.',
                errorMessage: error.message
            });
        }
    }
}

module.exports = UsuariosProTotalController;

