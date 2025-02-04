// controllers/controller_update_tokens.js
const TokensUpdateModel = require('../../models/tokens/model_update_tokens');
const logger = require('../../logger');
console.log('Logger inicializado:', logger); // Deve mostrar o objeto de logger esperado

const TokensUpdateController = {
    async updateToken(req, res) {
        const id = req.params.id;
        const data = req.body;

        try {
            await TokensUpdateModel.updateToken(id, data);
            res.status(200).json({ message: 'Token atualizado com sucesso' });
        } catch (error) {
            logger.error('Erro ao atualizar o token:', error);
            res.status(500).json({ error: 'Erro ao atualizar o token' });
        }
    }

};

module.exports = TokensUpdateController;

