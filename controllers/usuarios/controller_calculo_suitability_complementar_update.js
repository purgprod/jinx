const AtualizarSuitabilityComplementarModel = require('../../models/usuarios/model_calculo_suitability_complementar_update');
const ColetarSuitabilityComplementarModel = require('../../models/usuarios/model_coletar_suitability_complementar_usuario.js');
const logger = require('../../logger');

class ControllerCalculoSuitabilityComplementarUpdate {

    static async calcularSuitabilityComplementar(req, res) {
        const usuario_id = req.params.id;

        logger.info(`Início do processo de cálculo de suitability complementar para o usuário ${usuario_id}`);

        try {
            // Obtém as respostas do usuário através do model
            logger.info(`Buscando respostas do usuário ${usuario_id} no banco de dados`);
            const respostasUsuario = await ColetarSuitabilityComplementarModel.obterSuitabilityComplementarUsuario(usuario_id);

            logger.info(`Respostas do usuário ${usuario_id}: ${JSON.stringify(respostasUsuario)}`);

            if (!respostasUsuario || Object.keys(respostasUsuario).length === 0) {
                logger.warn(`Respostas do usuário ${usuario_id} não encontradas ou estão vazias`);
                return res.status(400).json({
                    message: "Respostas do usuário não encontradas."
                });
            }

            // Validação das respostas
            const chavesResposta = Object.keys(respostasUsuario);
            logger.info(`Chaves recebidas do usuário: ${chavesResposta.join(', ')}`);

            // Lista de chaves necessárias
            const chavesNecessarias = [
                'tolerancia_risco',
                'expectativa_retorno',
                'reacao_mudanca_mercado',
                'abordagem_diversificacao',
                'influencia_oscilacoes_mercado',
                'nivel_conforto_renda_variavel',
                'tempo_resiliencia_perdas',
                'busca_novas_oportunidades'
            ];

            const chavesFaltantes = chavesNecessarias.filter(chave => !chavesResposta.includes(chave));

            if (chavesFaltantes.length > 0) {
                logger.warn(`Chaves faltantes: ${chavesFaltantes.join(', ')}`);
                return res.status(400).json({
                    message: `Respostas faltantes: ${chavesFaltantes.join(', ')}`
                });
            }

            // Cálculo da pontuação total
            logger.info(`Iniciando cálculo da pontuação total`);
            let pontuacaoTotal = 0;
            for (const chave in respostasUsuario) {
                const valorResposta = parseInt(respostasUsuario[chave], 10);

                if (!isNaN(valorResposta)) {
                    pontuacaoTotal += valorResposta;
                    logger.info(`Valor '${valorResposta}' adicionado com sucesso para '${chave}'.`);
                } else {
                    logger.error(`Valor inválido para a chave '${chave}': '${respostasUsuario[chave]}'`);
                    return res.status(400).json({
                        message: `Valor inválido para a chave '${chave}'. Por favor, verifique as respostas.`
                    });
                }
            }

            // Determinação do suitability_complementar com base na pontuação total
            logger.info(`Pontuação total calculada: ${pontuacaoTotal}`);
            let suitability_complementar;
            if (pontuacaoTotal >= 8 && pontuacaoTotal <= 15) {
                suitability_complementar = "Conservador";
            } else if (pontuacaoTotal >= 16 && pontuacaoTotal <= 19) {
                suitability_complementar = "Moderado";
            } else if (pontuacaoTotal >= 20 && pontuacaoTotal <= 24) {
                suitability_complementar = "Agressivo";
            } else {
                suitability_complementar = "Perfil não definido";
                logger.warn(`Pontuação total '${pontuacaoTotal}' está fora do range esperado.`);
            }
            logger.info(`Perfil determinado: ${suitability_complementar}`);

            // Atualização do suitability no banco de dados
            logger.info(`Iniciando atualização do suitability para o usuário ${usuario_id}`);
            const resultado = await AtualizarSuitabilityComplementarModel.updateSuitabilityComplementar(suitability_complementar, usuario_id);
            logger.info(`Atualização concluída com sucesso: ${JSON.stringify(resultado)}`);

            // Retornar as respostas individuais, a pontuação total e o suitability_complementar
            return res.status(200).json({
                message: "Suitability atualizado com sucesso",
                dados: {
                    suitability_complementar: suitability_complementar,
                    pontuacaoTotal: pontuacaoTotal,
                    respostas: respostasUsuario
                }
            });

        } catch (error) {
            logger.error(`Erro ao calcular e salvar o suitability para o usuário ${usuario_id}:`, error);
            return res.status(500).json({
                message: "Ocorreu um erro ao processar as respostas",
                erro: error.message
            });
        }
    }
}

module.exports = ControllerCalculoSuitabilityComplementarUpdate;

