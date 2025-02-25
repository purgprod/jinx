// controllers/usuarios/controller_tokens_purg.js

const PurgTokensModel = require('../../models/ecossistema/model_tokens_purg');
const logger = require('../../logger');

class PurgTokensController {

    // Endpoint para buscar tokens da Purg
    static async getUserTokens(req, res) {
        const usuarioId = req.params.id;
        logger.info(`Tentativa de busca de tokens da Purg`);

        try {
            const tokens = await PurgTokensModel.tokensUsuario(usuarioId);
            if (tokens.length > 0) {
                logger.info(`Tokens encontrados para o usuário da Purg`);
	    } else {
                logger.info(`Nenhum token encontrado para o usuário da Purg`);
            }
            res.json(tokens);
        } catch (error) {
            logger.error(`Erro ao buscar tokens para o usuário da Purg`, error);
            res.status(500).json({ error: 'Erro ao buscar tokens do usuário' });
        }
    }
}

module.exports = PurgTokensController;

