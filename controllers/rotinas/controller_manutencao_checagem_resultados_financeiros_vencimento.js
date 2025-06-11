const BuscarResultadosFinanceirosModel = require('../../models/rotinas/model_manutencao_buscar_resultados_financeiros');
const RotinasInativarResultadosFinanceirosModel = require('../../models/rotinas/model_manutencao_inativar_resultados_financeiros');
const TokensBuscarModel = require('../../models/tokens/model_buscar_tokens');
const AtualizarDiasVencimentoModel = require('../../models/rotinas/model_manutencao_update_dias_vencimento');
const logger = require('../../logger');
const moment = require('moment'); // Import do moment.js

/**
 * Controller responsável por checar e inativar resultados financeiros vencidos
 */
const ChecagemResultadosFinanceirosVencimentoController = {
    /**
     * Verifica os resultados financeiros vencidos e os inativa
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     */
    async executeChecagemResultadosFinanceiros(req, res) {
        logger.info('Iniciando a inativação de resultados financeiros vencidos');
        try {
            // Busca tokens
            const resultado_tokens = await TokensBuscarModel.getTokens();
            logger.info(`Encontrados ${resultado_tokens.length} tokens`);

            if (resultado_tokens.length === 0) {
                logger.info('Nenhum token encontrado');
                return res.status(200).json({
                    message: 'Nenhum token encontrado',
                    tokens: []
                });
            }

            // Busca todos os resultados financeiros
            const resultadosFinanceiros = await BuscarResultadosFinanceirosModel.getResultadosFinanceiros();
            logger.info(`Encontrados ${resultadosFinanceiros.length} resultados financeiros`);

            if (resultadosFinanceiros.length === 0) {
                logger.info('Nenhum resultado financeiro vencido encontrado');
                return res.status(200).json({
                    message: 'Nenhum resultado financeiro vencido encontrado',
                    resultados: []
                });
            }

            const dataHoraAtual = moment(); // Cria uma instância do moment.js com a data/hora atual
            const resultadosInativados = [];
            const erros = [];

            // Processa cada resultado financeiro
            for (const resultado of resultadosFinanceiros) {
                const dataVencimento = moment(resultado.vencimento);
                const dataAtual = moment(); // Cria uma instância do moment.js com a data/hora atual

                if (dataVencimento.isBefore(dataAtual)) {
                    try {
                        // Inativa o resultado
                        await RotinasInativarResultadosFinanceirosModel.inativarResultadosFinanceiros(resultado.id_resultado);
                        resultadosInativados.push({
                            id_resultado: resultado.id_resultado,
                            vencimento: resultado.vencimento
                        });
                        logger.info(`Resultado ${resultado.id_resultado} inativado com sucesso`);
                    } catch (error) {
                        erros.push({
                            id_resultado: resultado.id_resultado,
                            vencimento: resultado.vencimento,
                            erro: error.message
                        });
                        logger.error(`Falha ao inativar o resultado ${resultado.id_resultado}:`, error);
                    }
                }
            }

            // Ajusta a data de vencimento
            const hoje = moment().format('YYYY-MM-DD'); // Formato: 2026-12-28

            // Processa cada token para atualização dos dias de vencimento
            for (const token of resultado_tokens) {
                try {
                    // Calcula a diferença entre o dia de hoje e a data de vencimento
                    const dataVencimentoToken = moment(token.vencimento);
                    const diferencaEmDias = dataVencimentoToken.diff(hoje, 'days');

                    // Atualiza o token com o novo valor de dias_vencimento
                    const updateResult = await AtualizarDiasVencimentoModel.atualizarDiasVencimento(diferencaEmDias, token.id_token);

                    logger.info(`Token ${token.id_token} atualizado com sucesso. Dias de vencimento: ${diferencaEmDias}`);
                } catch (error) {
                    logger.error(`Falha ao atualizar o token ${token.id_token}:`, error);
                }
            }

            // Prepara a resposta
            const resposta = {
                message: 'Rotinas executadas com sucesso',
                resultadosInativados: resultadosInativados,
                erros: erros
            };

            res.status(200).json(resposta);

        } catch (error) {
            logger.error('Erro ao processar resultados financeiros vencidos:', error);
            res.status(500).json({
                erro: 'Erro ao processar resultados financeiros vencidos',
                message: error.message
            });
        }
    }
};

module.exports = ChecagemResultadosFinanceirosVencimentoController;

