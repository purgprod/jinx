// controllers/usuarios/controller_tokens_ecossistema.js

const EcossistemaTokensModel = require('../../models/ecossistema/model_tokens_ecossistema');
const logger = require('../../logger');

class EcossistemaTokensController {

    // Endpoint para buscar tokens do ecossistema
    static async getUserTokens(req, res) {
        const usuarioId = req.params.id;
        logger.info(`Tentativa de busca de tokens do ecossitema`);

        try {
            const tokens = await EcossistemaTokensModel.tokensUsuario(usuarioId);
            if (tokens.length > 0) {
                logger.info(`Tokens encontrados para o ecossistema`);
	    } else {
                logger.info(`Nenhum token encontrado para o ecossistema`);
            }
            res.json(tokens);
        } catch (error) {
            logger.error(`Erro ao buscar tokens para o ecossistema`, error);
            res.status(500).json({ error: 'Erro ao buscar tokens do ecossistema' });
        }
    }
}

module.exports = EcossistemaTokensController;

