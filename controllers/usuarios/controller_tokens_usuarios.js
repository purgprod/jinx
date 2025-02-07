// controllers/usuarios/controller_tokens_usuarios.js

const UsuariosTokensModel = require('../../models/usuarios/model_tokens_usuarios');
const logger = require('../../logger');

class UsuariosTokensController {

    // Endpoint para buscar tokens de um usuário
    static async getUserTokens(req, res) {
        const usuarioId = req.params.id;
        logger.info(`Tentativa de busca de tokens para usuário com ID: ${usuarioId}`);

        try {
            const tokens = await UsuariosTokensModel.tokensUsuario(usuarioId);
            if (tokens.length > 0) {
                logger.info(`Tokens encontrados para o usuário com ID: ${usuarioId}`);
	    } else {
                logger.info(`Nenhum token encontrado para o usuário com ID: ${usuarioId}`);
            }
            res.json(tokens);
        } catch (error) {
            logger.error(`Erro ao buscar tokens para o usuário com ID: ${usuarioId}`, error);
            res.status(500).json({ error: 'Erro ao buscar tokens do usuário' });
        }
    }
}

module.exports = UsuariosTokensController;

