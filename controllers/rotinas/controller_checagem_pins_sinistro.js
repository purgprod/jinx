const BuscarPinsSinistroModel = require('../../models/rotinas/model_buscar_pins_sinistro');
const RotinasInativarPinsSinistroModel = require('../../models/rotinas/model_inativar_pins_sinistro');
const BuscarResultadosSinistroModel = require('../../models/rotinas/model_buscar_resultados_financeiros_sinistro');
const FlagSinistroResultadoModel = require('../../models/rotinas/model_gerenciamento_resultados_financeiros_sinistro');
const logger = require('../../logger');

/**
 * Controller responsável por inativar pins em sinistro
 */
const ChecagemPinsSinistroController = {
    /**
     * Busca os pins em sinistro e processa a inativação
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async executeChecagemPinsSinistro(req, res) {
        try {
            // Nova tarefa: Buscar e processar resultados de sinistro
            const resultadosSinistro = await BuscarResultadosSinistroModel.getResultadosSinistro();
            logger.info(`Resultados de sinistro encontrados: ${resultadosSinistro.length}`);

            // Log dos resultados encontrados
            if (resultadosSinistro.length > 0) {
                console.log('Lista de resultados para atualização:');
                console.log(resultadosSinistro.map(resultado => ({
                    id_resultado: resultado.id_resultado,
                    data_sinistro: resultado.data_sinistro
                })));
            }

            if (resultadosSinistro.length > 0) {
                // Atualiza o flag_sinistro para cada resultado
                const updatePromises = resultadosSinistro.map(async (resultado) => {
                    try {
                        // Converte data_sinistro para o formato correto
                        const dataSinistro = resultado.data_sinistro ? 
                            new Date(resultado.data_sinistro).toISOString().split('T')[0] : 
                            null;

                        await FlagSinistroResultadoModel.updateFlagSinistro(
                            resultado.id_resultado,
                            dataSinistro
                        );

                        return {
                            id_resultado: resultado.id_resultado,
                            status: 'sucesso',
                            message: 'Flag_sinistro atualizado com sucesso'
                        };
                    } catch (error) {
                        logger.error(`Erro ao atualizar flag_sinistro para o resultado ${resultado.id_resultado}:`, error);
                        return {
                            id_resultado: resultado.id_resultado,
                            status: 'erro',
                            message: `Erro ao atualizar flag_sinistro - ${error.message}`
                        };
                    }
                });

                const updateResults = await Promise.all(updatePromises);
                console.log('Resultados da atualização do flag_sinistro:');
                console.log(updateResults);
            }

            // Busca os pins em sinistro
            const pinsSinistro = await BuscarPinsSinistroModel.getPinsSinistro();
            logger.info(`Pins em sinistro encontrados: ${pinsSinistro.length}`);

            if (pinsSinistro.length === 0) {
                logger.info('Nenhum pin em sinistro encontrado');
                return res.status(200).json({ 
                    message: 'Nenhum pin em sinistro encontrado',
                    preliminaryStep: {
                        status: 'success',
                        message: 'Resultados de sinistro processados com sucesso'
                    }
                });
            }

            // Processa cada pin para inativação
            const processedResults = await Promise.all(
                pinsSinistro.map(async (pin) => {
                    try {
                        // Chama o model para inativar o pin
                        await RotinasInativarPinsSinistroModel.inativarPinsSinistro(pin.id_token);
                        
                        return {
                            id_token: pin.id_token,
                            status: 'sucesso',
                            message: 'Pin inativado com sucesso'
                        };
                    } catch (error) {
                        logger.error(`Erro ao inativar o Pin ${pin.id_token}:`, error);
                        return {
                            id_token: pin.id_token,
                            status: 'erro',
                            message: 'Erro ao inativar o Pin'
                        };
                    }
                })
            );

            const successCount = processedResults.filter(result => result.status === 'sucesso').length;
            const errosCount = processedResults.length - successCount;

            res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                totalProcessados: pinsSinistro.length,
                totalSucesso: successCount,
                totalErros: errosCount,
                results: processedResults,
                preliminaryStep: {
                    status: 'success',
                    message: 'Resultados de sinistro processados com sucesso'
                }
            });

        } catch (error) {
            logger.error('Erro ao processar inativação de pins em sinistro:', error);
            res.status(500).json({ 
                error: 'Erro ao processar inativação de pins em sinistro',
                message: error.message,
                preliminaryStep: {
                    status: 'error',
                    message: 'Erro ao processar resultados de sinistro'
                }
            });
        }
    }
};

module.exports = ChecagemPinsSinistroController;

