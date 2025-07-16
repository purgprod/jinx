// controllers/emblemas/controller_buscar_pagamento_emblemas_total.js

const PagamentosEmblemasTotalModel = require('../../models/emblemas/model_buscar_pagamento_emblemas_total');
const logger = require('../../logger');

class PagamentosEmblemasTotalController {

    // Endpoint para obter todos os emblemas total do ecossistema
    static async getPagamentosEmblemasTotal(req, res) {
        const usuarioId = req.params.id;

        try {
            console.log(`Buscando total de emblemas do ecossistema`);
            
            // Busca os dados no model
            const dadosTotal = await PagamentosEmblemasTotalModel.getPagamentosEmblemasTotal(usuarioId);
            
            console.log(`Dados retornados do ecossistema:`);
            console.log({
                total: dadosTotal
            });

            res.status(200).json(dadosTotal);

        } catch (error) {
            logger.error(`Erro ao buscar total de emblemas para o ecossistema: ${error.message}`);
            console.error(`Detalhes do erro:`, error);
            res.status(500).json({ error: 'Erro ao buscar total de emblemas.' });
        }
    }
}

module.exports = PagamentosEmblemasTotalController;

