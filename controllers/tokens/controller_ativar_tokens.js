// controllers/tokens/controller_ativar_tokens.js
const TokensAtivarModel = require('../../models/tokens/model_ativar_tokens');
const logger = require('../../logger');
console.log('Logger inicializado:', logger); // Deve mostrar o objeto de logger esperado

const TokensAtivarController = {
    async ativarToken(req, res) {
        const id = req.params.id;
        
        try {
            await TokensAtivarModel.ativarToken(id);
            res.status(200).json({ message: 'Token ativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao ativar o token:', error);
            res.status(500).json({ error: 'Erro ao ativar o resultado financeiro' });
        }
    }
};

module.exports = TokensAtivarController;

