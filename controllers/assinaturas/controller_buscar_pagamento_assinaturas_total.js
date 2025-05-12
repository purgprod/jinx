// controllers/ecossistema/controller_buscar_pagamento_assinaturas_total.js

const PagamentosAssinaturasTotalModel = require('../../models/assinaturas/model_buscar_pagamento_assinaturas_total');
const logger = require('../../logger');

class PagamentosAssinaturasTotalController {

    // Endpoint para obter todos os dados de pagamentos das assinaturas total do ecossistema
    static async getPagamentosAssinaturasTotal(req, res) {
        const usuarioId = req.params.id;

        try {
            console.log(`[GET] Buscando dados de pagamentos das assinaturas total para o usuário: ${usuarioId}`);
            
            // Busca os dados no model
            const dadosTotal = await PagamentosAssinaturasTotalModel.getPagamentosAssinaturasTotal(usuarioId);
            
            console.log(`[DADOS RETORNADOS DO MODEL]`);
            console.log({
                total: dadosTotal
            });

            res.status(200).json(dadosTotal);

        } catch (error) {
            logger.error(`Erro ao buscar dados de pagamento das assinaturas total para o ecossistema: ${error.message}`);
            console.error(`[ERRO] - Detalhes do erro:`, error);
            res.status(500).json({ error: 'Erro ao buscar dados de pagamento das assinaturas total.' });
        }
    }
}

module.exports = PagamentosAssinaturasTotalController;

