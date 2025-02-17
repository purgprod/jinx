// controllers/tokens/controller_freefloat_tokens.js
const TokensFreeFloatModel = require('../../models/tokens/model_free_float_tokens');
const logger = require('../../logger');

const TokensFreeFloatController = {
    async getFreeFloatTokens(req, res) {
        try {
            const tokenId = req.params.id;  // Obter o ID do token da URL
            const results = await TokensFreeFloatModel.getFreeFloatTokensById(tokenId);
            res.status(200).json(results);
        } catch (error) {
            logger.error('Erro ao obter free float tokens:', error);
            res.status(500).json({ error: 'Erro ao obter free float tokens' });
        }
    }
};

module.exports = TokensFreeFloatController;

