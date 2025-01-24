// controllers/controller_tokens.js
const TokensModel = require('../models/model_tokens');
const logger = require('../logger');
console.log('Logger inicializado:', logger); // Deve mostrar o objeto de logger esperado

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

    async updateToken(req, res) {
        const id = req.params.id;
        const data = req.body;

        try {
            await TokensModel.updateToken(id, data);
            res.status(200).json({ message: 'Token atualizado com sucesso' });
        } catch (error) {
            logger.error('Erro ao atualizar o token:', error);
            res.status(500).json({ error: 'Erro ao atualizar o token' });
        }
    },

   async inativarToken(req, res) {
        const id = req.params.id;
        
        try {
            await TokensModel.inativarToken(id);
            res.status(200).json({ message: 'Token inativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao inativar o token:', error);
            res.status(500).json({ error: 'Erro ao token' });
        }
    },

    async ativarToken(req, res) {
        const id = req.params.id;
        
        try {
            await TokensModel.ativarToken(id);
            res.status(200).json({ message: 'Token ativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao ativar o token:', error);
            res.status(500).json({ error: 'Erro ao ativar o resultado financeiro' });
        }
    }

};

module.exports = TokensController;

