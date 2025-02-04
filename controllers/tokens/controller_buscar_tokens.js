// controllers/tokens/controller_buscar_tokens.js
const TokensBuscarModel = require('../../models/tokens/model_buscar_tokens');
const logger = require('../../logger');
console.log('Logger inicializado:', logger); // Deve mostrar o objeto de logger esperado

const TokensBuscarController = {
    async getTokens(req, res) {
        logger.info('Consulta iniciada para tokens');

        try {
            const tokens = await TokensBuscarModel.getTokens();
            logger.info(`Tokens obtidos: ${JSON.stringify(tokens)}`);
            res.json(tokens);
        } catch (error) {
            logger.error('Erro ao consultar a tabela tokens:', error);
            res.status(500).json({ error: 'Erro ao consultar tokens' });
        }
    }

};

module.exports = TokensBuscarController;

