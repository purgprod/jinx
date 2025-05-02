const BuscarResultadosFinanceirosModel = require('../../models/rotinas/model_manutencao_buscar_resultados_financeiros');
const RotinasInativarResultadosFinanceirosModel = require('../../models/rotinas/model_manutencao_inativar_resultados_financeiros');
const logger = require('../../logger');

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

            const dataHoraAtual = new Date().toISOString();
            const resultadosInativados = [];
            const erros = [];

            // Processa cada resultado financeiro
            for (const resultado of resultadosFinanceiros) {
                const dataVencimento = new Date(resultado.vencimento);
                const dataAtual = new Date(dataHoraAtual);

                if (dataVencimento < dataAtual) {
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

