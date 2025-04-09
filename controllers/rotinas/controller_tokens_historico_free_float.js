const TokensHistoricoFreeFloatModel = require('../../models/rotinas/model_tokens_historico_free_float');
const TokensHistoricoFreeFloatValoresModel = require('../../models/rotinas/model_tokens_historico_free_float_valores');
const TokensHistoricoFreeFloatInsertModel = require('../../models/rotinas/model_tokens_historico_free_float_insert');
const logger = require('../../logger');

/**
 * Controller responsável por executar rotinas relacionadas a tokens de free float
 */
const TokensHistoricoFreeFloatController = {
    /**
     * Executa as rotinas para os tokens ativos e busca os valores adicionais
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async executeTokensHistoricoFreeFloat(req, res) {
        try {
            // Busca todos os tokens ativos
            const activeTokens = await TokensHistoricoFreeFloatModel.getActiveTokens();
            logger.info(`Tokens ativos encontrados: ${activeTokens.length}`);

            // Verifica se há tokens para processar
            if (activeTokens.length === 0) {
                logger.info('Nenhum token ativo encontrado');
                return res.status(200).json({ message: 'Nenhum token ativo encontrado' });
            }

            // Função para sanitizar os valores (converte null para 0)
            const sanitizeValues = (values) => {
                // Se os valores forem nulos ou undefinidos, retorna um objeto vazio
                if (!values) return { total_tokens: 0, free_float_tokens: 0 };
                
                // Garante que as propriedades existam
                return {
                    total_tokens: values.total_tokens || 0,
                    free_float_tokens: values.free_float_tokens || 0
                };
            };

            // Processa cada token e busca os valores adicionais
            const processedTokens = await Promise.all(
                activeTokens.map(async (token) => {
                    try {
                        // Busca os valores adicionais para o token atual
                        const tokenValues = await TokensHistoricoFreeFloatValoresModel.getValoresByTokenId(token.id_token);
                        
                        // Sanitiza os valores
                        const sanitizedValues = sanitizeValues(tokenValues);

                        // Verifica se os valores são válidos
                        if (sanitizedValues) {
                            // Prepara os dados para insert
                            const insertData = {
                                data: new Date().toISOString().split('T')[0],
                                token_id: token.id_token,
                                token_ipo: sanitizedValues.total_tokens,
                                token_freefloat: sanitizedValues.free_float_tokens
                            };

                            // Realiza o insert histórico
                            await TokensHistoricoFreeFloatInsertModel.insertHistorico(insertData);
                            logger.info(`Histórico inserido com sucesso para token ${token.id_token}`);
                        }

                        // Cria um objeto combinando as informações do token e seus valores
                        return {
                            token: token,
                            valores: sanitizedValues
                        };
                    } catch (error) {
                        logger.error(`Erro ao processar token ${token.id_token}:`, error);
                        return {
                            token: token,
                            error: 'Erro ao buscar ou salvar valores adicionais'
                        };
                    }
                })
            );

            // Filtra tokens com erros
            const successfulTokens = processedTokens.filter(token => !token.error);
            const tokensWithErrors = processedTokens.filter(token => token.error);

            // Retorna uma resposta com os tokens processados
            res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                tokens: successfulTokens
            });

            // Se houver tokens com erros, loga o problema
            if (tokensWithErrors.length > 0) {
                logger.warn(`Tokens com erros: ${tokensWithErrors.length}`);
                logger.warn(tokensWithErrors);
            }
        } catch (error) {
            logger.error('Erro ao executar rotinas:', error);
            res.status(500).json({ error: 'Erro ao executar rotinas' });
        }
    }
};

module.exports = TokensHistoricoFreeFloatController;

