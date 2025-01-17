// controllers/controller_tokens.js
const TokensModel = require('../models/model_tokens');
const logger = require('../logger');

const TokensController = {
    async getTokens(req, res) {
        logger.info('Consulta iniciada para tokens');

        try {
            const tokens = await TokensModel.getTokens();
            logger.info(`Tokens obtidos: ${JSON.stringify(tokens)}`);
            res.json(tokens);
        } catch (error) {
            logger.error('Erro ao consultar a tabela tokens:', error);
            res.status(500).json({ error: 'Erro ao consultar tokens' });
        }
    },

    async updateTokens(req, res) {
        const id = req.params.id;
        const data = req.body;

        try {
            await TokensModel.updateTokens(id, data);
            res.status(200).json({ message: 'Dados atualizados com sucesso' });
        } catch (error) {
            logger.error('Erro ao atualizar o token:', error);
            res.status(500).json({ error: 'Erro ao atualizar o token' });
        }
    }
};

module.exports = TokensController;

