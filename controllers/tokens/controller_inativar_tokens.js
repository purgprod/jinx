// controllers/tokens/controller_inativar_tokens.js
const TokensInativarModel = require('../../models/tokens/model_inativar_tokens');
const logger = require('../../logger');
console.log('Logger inicializado:', logger); // Deve mostrar o objeto de logger esperado

const TokensInativarController = {
   async inativarToken(req, res) {
        const id = req.params.id;
        
        try {
            await TokensInativarModel.inativarToken(id);
            res.status(200).json({ message: 'Token inativado com sucesso' });
        } catch (error) {
            logger.error('Erro ao inativar o token:', error);
            res.status(500).json({ error: 'Erro ao token' });
        }
    }

};

module.exports = TokensInativarController;

