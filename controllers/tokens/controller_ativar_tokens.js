// controllers/tokens/controller_ativar_tokens.js
const TokensAtivarModel = require('../../models/tokens/model_ativar_tokens');
const { executarVendaTodosPins } = require('../../services/vender_todos_pins_service');
const logger = require('../../logger');

const TokensAtivarController = {
    async ativarToken(req, res) {
        const id = req.params.id;

        try {
            await TokensAtivarModel.ativarToken(id);
            res.status(200).json({ message: 'Token ativado com sucesso' });

            // Dispara a venda de todos os pins em background sem bloquear a resposta.
            // Usuários com mais pontos (que compram primeiro na rotina diária) terão
            // acesso prioritário ao novo Pin recém-ativado.
            setImmediate(() => {
                executarVendaTodosPins().catch(err =>
                    logger.error(`[VENDA] Erro ao vender pins após ativação do token ${id}: ${err.message}`)
                );
            });
        } catch (error) {
            logger.error('Erro ao ativar o token:', error);
            res.status(500).json({ error: 'Erro ao ativar o token' });
        }
    }
};

module.exports = TokensAtivarController;
