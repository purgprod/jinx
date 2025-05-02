const logger = require('../../logger');
const BuscarCarteirasModel = require('../../models/rotinas/model_manutencao_buscar_carteiras');
const UpdateRankingUsuariosModel = require('../../models/rotinas/model_manutencao_update_ranking_usuarios');
const rankings = require('./rankings');

const ManutencaoRankingUsuariosController = {
    async executeManutencaoRankingUsuarios(req, res) {
        try {
            logger.info('Iniciando manutenção de ranking de usuários');

            // Etapa 1: Buscar carteiras
            const carteiras = await BuscarCarteirasModel.getCarteiras();

            if (!carteiras || carteiras.length === 0) {
                logger.warn('Nenhuma carteira encontrada');
                return res.status(200).json({
                    message: 'Nenhuma carteira encontrada',
                    carteiras: []
                });
            }

            // Etapa 2: Processar os dados para somar saldo e investido por usuário
            logger.info('Processando dados para somar saldo e investido por usuário');
            
            const usuariosProcessados = {};

            try {
                for (const carteira of carteiras) {
                    const usuarioId = carteira.usuario_id;
                    
                    // Garantir que os valores sejam números válidos
                    const saldo = typeof carteira.saldo === 'number' ? carteira.saldo : parseFloat(carteira.saldo);
                    const investido = typeof carteira.investido === 'number' ? carteira.investido : parseFloat(carteira.investido);

                    if (isNaN(saldo) || isNaN(investido)) {
                        logger.warn(`Valores inválidos para o usuário ${usuarioId}`);
                        continue;
                    }

                    if (!usuariosProcessados[usuarioId]) {
                        usuariosProcessados[usuarioId] = {
                            saldo_total: 0,
                            investido_total: 0,
                            valor_total: 0
                        };
                    }

                    usuariosProcessados[usuarioId].saldo_total += saldo;
                    usuariosProcessados[usuarioId].investido_total += investido;
                    usuariosProcessados[usuarioId].valor_total += saldo + investido;

                    logger.info(`Valor da soma para o usuário ${usuarioId}:`);
                    logger.info(`Saldo total: ${usuariosProcessados[usuarioId].saldo_total.toFixed(8)}`);
                    logger.info(`Investido total: ${usuariosProcessados[usuarioId].investido_total.toFixed(8)}`);
                    logger.info(`Valor total: ${usuariosProcessados[usuarioId].valor_total.toFixed(8)}`);
                    logger.info('----------------------------------------');
                }

                logger.info('Processamento de dados concluído com sucesso');

                // Etapa 3: Verificar o ranking de cada usuário
                logger.info('Iniciando verificação do ranking dos usuários');

                // Ordenar os rankings por valor mínimo em ordem decrescente
                const rankingsOrdenados = [...rankings].sort((a, b) => b.valorMinimo - a.valorMinimo);

                // Determinar o ranking para cada usuário
                for (const usuarioId in usuariosProcessados) {
                    const valorTotal = usuariosProcessados[usuarioId].valor_total;
                    let nomeRanking = 'Pioneiro Financeiro'; // Ranking padrão mais baixo

                    // Encontrar o ranking adequado
                    for (const ranking of rankingsOrdenados) {
                        if (valorTotal >= ranking.valorMinimo) {
                            nomeRanking = ranking.nomeRanking;
                            break;
                        }
                    }

                    logger.info(`Verificação do ranking para o usuário ${usuarioId}:`);
                    logger.info(`Valor total: R$ ${valorTotal.toFixed(2)}`);
                    logger.info(`Ranking determinado: ${nomeRanking}`);
                    logger.info('----------------------------------------');

                    // Atualizar os dados do usuário com o nome do ranking
                    usuariosProcessados[usuarioId].nomeRanking = nomeRanking;
                }

                // Etapa 4: Atualizar o ranking de cada usuário no banco de dados
                logger.info('Iniciando atualização do ranking dos usuários no banco de dados');

                try {
                    // Preparar as atualizações
                    const atualizacoes = [];
                    for (const usuarioId in usuariosProcessados) {
                        const ranking = usuariosProcessados[usuarioId].nomeRanking;
                        atualizacoes.push(
                            UpdateRankingUsuariosModel.executarUpdate(ranking, usuarioId)
                        );
                    }

                    // Executar todas as atualizações em paralelo
                    await Promise.all(atualizacoes);

                    logger.info('Atualização do ranking dos usuários concluída com sucesso');

                    // Resposta final com os dados processados
                    return res.status(200).json({
                        message: 'Manutenção de ranking de usuários concluída com sucesso',
                        carteiras: carteiras,
                        usuarios_processados: usuariosProcessados
                    });

                } catch (error) {
                    logger.error(`Erro ao atualizar os rankings dos usuários: ${error.message}`);
                    return res.status(500).json({
                        error: 'Erro interno',
                        message: 'Ocorreu um erro ao atualizar os rankings dos usuários'
                    });
                }

            } catch (error) {
                logger.error(`Erro ao processar os dados: ${error.message}`);
                return res.status(500).json({
                    error: 'Erro interno',
                    message: 'Ocorreu um erro ao processar os dados de saldo e investido'
                });
            }

        } catch (error) {
            logger.error(`Erro inesperado: ${error.message}`);
            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro inesperado durante a execução da rotina'
            });
        }
    }
};

module.exports = ManutencaoRankingUsuariosController;

