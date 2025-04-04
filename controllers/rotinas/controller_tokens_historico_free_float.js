// controllers/rotinas/controller_tokens_historico_free_float.js
const TokensHistoricoFreeFloatModel = require('../../models/rotinas/model_tokens_historico_free_float');
const logger = require('../../logger');

const TokensHistoricoFreeFloatController = {
    async executeTokensHistoricoFreeFloat(req, res) {
        try {
            // Busca todos os tokens ativos
            const activeTokens = await TokensHistoricoFreeFloatModel.getActiveTokens();
            logger.info(`Tokens ativos encontrados: ${activeTokens.length}`);

            // Aqui você implementará a lógica específica para cada token ativo
            // Vamos apenas simular uma execução de rotina
            activeTokens.forEach(token => {
                logger.info(`Executando rotina para token ID: ${token.id_token}`);
                // Coloque aqui a lógica que será executada para cada token
            });

            // Retorna uma resposta de sucesso
            res.status(200).json({ message: 'Rotinas executadas com sucesso!' });
        } catch (error) {
            logger.error('Erro ao executar rotinas:', error);
            res.status(500).json({ error: 'Erro ao executar rotinas' });
        }
    }
};

module.exports = TokensHistoricoFreeFloatController;

