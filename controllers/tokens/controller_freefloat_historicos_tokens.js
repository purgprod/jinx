const TokensFreeFloatHistoricosModel = require('../../models/tokens/model_free_float_historicos_tokens');
const logger = require('../../logger');

class TokensFreeFloatHistoricosController {
    // Endpoint para obter todos os dados de free float históricos de um token
    static async getFreeFloatHistoricos(req, res) {
        const tokenId = req.params.id;

        try {
            const freefloatHistoricos = await TokensFreeFloatHistoricosModel.getFreeFloatTokensHistoricos(tokenId);
            res.status(200).json(freefloatHistoricos);
        } catch (error) {
            logger.error(`Erro ao buscar dados de free float históricos para o token ID: ${tokenId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar dados de free float históricos.' });
        }
    }
}

module.exports = TokensFreeFloatHistoricosController;

