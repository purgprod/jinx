const AtualizarSuitabilityModel = require('../../models/usuarios/model_calculo_suitability_update');
const ColetarSuitabilityModel = require('../../models/usuarios/model_coletar_suitability_usuario.js');
const logger = require('../../logger');

class ControllerCalculoSuitabilityUpdate {

    static async calcularSuitability(req, res) {
        const usuarioId = req.params.id;

        logger.info(`Início do processo de cálculo de suitability para o usuário ${usuarioId}`);

        try {
            // Definição dos pesos para cada pergunta
            const pesos = {
                qual_objetivo: 10,
                quanto_tempo: 15,
                qual_necessidade: 10,
                qual_percentual: 10,
                oscilacoes_mercado: 20,
                formacao: 5,
                experiencia: 10,
                expectativa_5_anos: 5,
                operacoes_derivativos: 5,
                volume_frequencia_renda_fixa_basica: 2.5,
                volume_frequencia_outros: 2.5,
                volume_frequencia_renda_variavel_basica: 2.5,
                volume_frequencia_derivativos: 2.5
            };

            // Obtém as respostas do usuário através do model
            logger.info(`Buscando respostas do usuário ${usuarioId} no banco de dados`);
            const respostasUsuario = await ColetarSuitabilityModel.obterSuitabilityUsuario(usuarioId);

            logger.info(`Respostas do usuário ${usuarioId}: ${JSON.stringify(respostasUsuario)}`);

            if (!respostasUsuario || Object.keys(respostasUsuario).length === 0) {
                logger.warn(`Respostas do usuário ${usuarioId} não encontradas ou estão vazias`);
                return res.status(400).json({
                    message: "Respostas do usuário não encontradas."
                });
            }

            // Validação das respostas
            const chavesResposta = Object.keys(respostasUsuario);
            logger.info(`Chaves recebidas do usuário: ${chavesResposta.join(', ')}`);

            // Lista de chaves necessárias
            const chavesNecessarias = Object.keys(pesos);

            const chavesFaltantes = chavesNecessarias.filter(chave => !chavesResposta.includes(chave));

            if (chavesFaltantes.length > 0) {
                logger.warn(`Chaves faltantes: ${chavesFaltantes.join(', ')}`);
                return res.status(400).json({
                    message: `Respostas faltantes: ${chavesFaltantes.join(', ')}`
                });
            }

            // Cálculo da pontuação total com base nos pesos
            logger.info(`Iniciando cálculo da pontuação total`);
            let pontuacaoTotal = 0;
            for (const chave in respostasUsuario) {
                const valorResposta = parseInt(respostasUsuario[chave], 10);
                const peso = pesos[chave];

                if (!isNaN(valorResposta)) {
                    pontuacaoTotal += (valorResposta * peso);
                    logger.info(`Pontuação adicionada com sucesso para '${chave}': ${valorResposta * peso}`);
                } else {
                    logger.error(`Valor inválido para a chave '${chave}': '${respostasUsuario[chave]}'`);
                    return res.status(400).json({
                        message: `Valor inválido para a chave '${chave}'. Por favor, verifique as respostas.`
                    });
                }
            }

            // Determinação do perfil com base na pontuação total
            logger.info(`Pontuação total calculada: ${pontuacaoTotal}`);
            let perfil;
            if (pontuacaoTotal <= 133) {
                perfil = "Conservador";
            } else if (pontuacaoTotal > 133 && pontuacaoTotal <= 266) {
                perfil = "Moderado";
            } else {
                perfil = "Agressivo";
            }
            logger.info(`Perfil determinado: ${perfil}`);

            // Atualização do suitability no banco de dados
            logger.info(`Iniciando atualização do suitability para o usuário ${usuarioId}`);
            const resultado = await AtualizarSuitabilityModel.updateSuitability(perfil, usuarioId);
            logger.info(`Atualização concluída com sucesso: ${JSON.stringify(resultado)}`);

            return res.status(200).json({
                message: "Suitability atualizado com sucesso",
                dados: {
                    perfil: perfil,
                    pontuacaoTotal: pontuacaoTotal
                }
            });

        } catch (error) {
            logger.error(`Erro ao calcular e salvar o suitability para o usuário ${usuarioId}:`, error);
            return res.status(500).json({
                message: "Ocorreu um erro ao processar as respostas",
                erro: error.message
            });
        }
    }
}

module.exports = ControllerCalculoSuitabilityUpdate;

