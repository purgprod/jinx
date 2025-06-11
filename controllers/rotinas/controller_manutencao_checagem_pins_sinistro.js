const BuscarPinsSinistroModel = require('../../models/rotinas/model_buscar_pins_sinistro');
const RotinasInativarPinsModel = require('../../models/rotinas/model_manutencao_inativar_pins');
const BuscarResultadosSinistroModel = require('../../models/rotinas/model_buscar_resultados_financeiros_sinistro');
const FlagSinistroResultadoModel = require('../../models/rotinas/model_gerenciamento_resultados_financeiros_sinistro');
const logger = require('../../logger');

const ChecagemPinsSinistroController = {
    async executeChecagemPinsSinistro(req, res) {
        try {
            const resultadosSinistro = await BuscarResultadosSinistroModel.getResultadosSinistro();
            logger.info(`Resultados de sinistro encontrados: ${resultadosSinistro.length}`);

            if (resultadosSinistro.length > 0) {
                console.log('Lista de resultados para atualização:');
                console.log(resultadosSinistro.map(resultado => ({
                    id_resultado: resultado.id_resultado,
                    data_sinistro: resultado.data_sinistro
                })));
            }

            const updateResults = [];
            for (const resultado of resultadosSinistro) {
                let retries = 0;
                let success = false;
                do {
                    try {
                        const dataSinistro = resultado.data_sinistro ? 
                            new Date(resultado.data_sinistro).toISOString().split('T')[0] : 
                            null;
                        await FlagSinistroResultadoModel.updateFlagSinistro(
                            resultado.id_resultado,
                            dataSinistro
                        );
                        updateResults.push({
                            id_resultado: resultado.id_resultado,
                            status: 'sucesso',
                            message: 'Flag_sinistro atualizado com sucesso'
                        });
                        success = true;
                    } catch (error) {
                        logger.error(`Tentativa ${retries + 1} falhou para resultado ${resultado.id_resultado}:`, error);
                        retries++;
                        if (retries >= 3) {
                            updateResults.push({
                                id_resultado: resultado.id_resultado,
                                status: 'erro',
                                message: `Erro após ${retries} tentativas - ${error.message}`
                            });
                            success = true;
                        }
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } while (!success && retries < 3);
            }

            const pinsSinistro = await BuscarPinsSinistroModel.getPinsSinistro();
            logger.info(`Pins em sinistro encontrados: ${pinsSinistro.length}`);

            if (pinsSinistro.length === 0) {
                logger.info('Nenhum pin em sinistro encontrado');
                return res.status(200).json({ 
                    message: 'Rotinas executadas com sucesso',
                    preliminaryStep: {
                        status: 'success',
                        message: 'Resultados de sinistro processados com sucesso'
                    }
                });
            }

            const processedResults = await Promise.all(
                pinsSinistro.map(async (pin) => {
                    try {
                        await RotinasInativarPinsModel.inativarPins(pin.id_token);
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

