// controllers/rotinas/controller_poppy_compra_diaria_pins.js
const Mutex = require('async-mutex').Mutex;
const logger = require('../../logger');
const { withTransaction } = require('../../database/transaction');
const BuscarUsuariosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_usuarios_e_carteiras');
const ConverterEmblemasModel = require('../../models/rotinas/model_poppy_converter_emblemas_em_saldo'); // Importa o model de conversão
const carteiras = require('./carteiras');
const UsersTokensModel = require('../../models/usuarios/model_tokens_usuarios');
const ratings = require('./ratings');
const BuscarPinsDisponiveisModel = require('../../models/rotinas/model_poppy_buscar_pins_disponiveis');
const AtualizarQuantidadeTokensModel = require('../../models/rotinas/model_poppy_comprar_pins_disponiveis');
const UsersSaldosModel = require('../../models/usuarios/model_saldos_usuarios');
const AtualizarSaldoUsuariosModel = require('../../models/rotinas/model_poppy_atualizar_saldo_usuarios');
const rankingAcessoInvestimentos = require('../../public/js/usuarios/acesso_investimentos_por_ranking');
const rankings = rankingAcessoInvestimentos.default; // Acessa o array exportado pelo módulo

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

// Criar um mutex para controlar o acesso concorrente
const mutex = new Mutex();

const CompraDiariaPinsController = {
    async executarCompraDiariaPins(req, res) {
        logger.info('Iniciando a coleta e processamento sequencial de usuários');

        try {
            // Etapa 1: Importar rankings e acessos correspondentes
            logger.info('Importando rankings e acessos correspondentes');

            // Etapa 2: Buscar usuários e carteiras
            const usuariosCarteiras = await BuscarUsuariosCarteirasModel.getUsuariosCarteiras();

            if (!usuariosCarteiras.length) {
                logger.warn('Nenhum usuário ativo encontrado');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    usuariosPro: [],
                    usuariosBasic: [],
                });
            }

            // Separação inicial de usuários
            const usuariosPro = [];
            const usuariosBasic = [];
            const outros = []; 

            usuariosCarteiras.forEach(usuario => {
                logger.info(`Processando usuário ${usuario.usuario_id}`);
                logger.info(`Dados do usuário: ${JSON.stringify(usuario, null, 2)}`);

                switch (usuario.assinatura) {
                    case 'Poppy Pro':
                        usuariosPro.push(usuario);
                        break;
                    case 'Poppy Basic':
                        usuariosBasic.push(usuario);
                        break;
                    default:
                        outros.push(usuario);
                        break;
                }
            });

            // Ordenar usuários Pro e Basic pelo valor investido
            usuariosPro.sort((a, b) => b.investido - a.investido);
            usuariosBasic.sort((a, b) => b.investido - a.investido);

            logger.info('Ordem dos usuários Pro por investimento:');
            usuariosPro.forEach((usuario, index) => {
                logger.info(`${index + 1}: Usuário ID ${usuario.usuario_id} - Investido: ${usuario.investido}`);
            });
            logger.info('Ordem dos usuários Basic por investimento:');
            usuariosBasic.forEach((usuario, index) => {
                logger.info(`${index + 1}: Usuário ID ${usuario.usuario_id} - Investido: ${usuario.investido}`);
            });

            logger.info(`Usuários Pro encontrados: ${usuariosPro.length}`);
            logger.info(`Usuários Basic encontrados: ${usuariosBasic.length}`);
            logger.info(`Outros usuários encontrados: ${outros.length}`);

            // Função para processar um usuário
            const processarUsuario = async (usuario) => {
                try {
                    // Etapa 2: Organizar usuário (incluindo dados oriundos da tabela carteiras)
                    const usuarioOrganizado = {
                        usuario_id: usuario.usuario_id,
                        investido: usuario.investido,
                        suitability: usuario.suitability,
                        suitability_complementar: usuario.suitability_complementar,
                        saldo: usuario.saldo,         // Valor vindo da tabela "carteiras"
                        ranking: usuario.ranking,
                        emblemas: usuario.emblemas      // Valor vindo da tabela "carteiras"
                    };

                    logger.info('-------------------------');
                    logger.info('Dados do usuário organizado:');
                    logger.info(JSON.stringify(usuarioOrganizado, null, 2));

                    // Etapa 3: Definir porcentagens da carteira
                    const definirPorcentagens = () => {
                        const carteira = carteiras.find(c => 
                            c.suitability === usuarioOrganizado.suitability && 
                            c.suitability_complementar === usuarioOrganizado.suitability_complementar
                        );
                        
                        if (carteira) {
                            logger.info('-------------------------');
                            logger.info(`Usuário ${usuarioOrganizado.usuario_id} - Carteira encontrada:`);
                            logger.info(`Suitability: ${usuarioOrganizado.suitability}`);
                            logger.info(`Suitability Complementar: ${usuarioOrganizado.suitability_complementar}`);
                            logger.info(`Porcentagens pré-definidas: ${carteira.porcentagem_pin_conservador}% Conservador, ${carteira.porcentagem_pin_moderado}% Moderado, ${carteira.porcentagem_pin_agressivo}% Agressivo`);
                            
                            return {
                                ...usuarioOrganizado,
                                porcentagem_pin_conservador: carteira.porcentagem_pin_conservador,
                                porcentagem_pin_moderado: carteira.porcentagem_pin_moderado,
                                porcentagem_pin_agressivo: carteira.porcentagem_pin_agressivo
                            };
                        }
                        
                        const defaultCarteira = {
                            porcentagem_pin_conservador: 50,
                            porcentagem_pin_moderado: 30,
                            porcentagem_pin_agressivo: 20
                        };

                        logger.warn(`Nenhuma carteira encontrada para o usuário ${usuarioOrganizado.usuario_id}`);
                        logger.warn(`Usuário ${usuarioOrganizado.usuario_id} - Utilizando carteira padrão:`);
                        logger.warn(`Porcentagens: ${defaultCarteira.porcentagem_pin_conservador}% Conservador, ${defaultCarteira.porcentagem_pin_moderado}% Moderado, ${defaultCarteira.porcentagem_pin_agressivo}% Agressivo`);
                        
                        return {
                            ...usuarioOrganizado,
                            porcentagem_pin_conservador: defaultCarteira.porcentagem_pin_conservador,
                            porcentagem_pin_moderado: defaultCarteira.porcentagem_pin_moderado,
                            porcentagem_pin_agressivo: defaultCarteira.porcentagem_pin_agressivo
                        };
                    };

                    const usuarioComPorcentagens = definirPorcentagens();

                    // Etapa 4: Buscar tokens e risco para o usuário
                    const tokens = await UsersTokensModel.tokensUsuario(usuarioComPorcentagens.usuario_id);
                    
                    const usuarioComTokens = {
                        ...usuarioComPorcentagens,
                        quantidade_tokens: tokens.length > 0 ? tokens[0].quantidade_tokens : 0,
                        risco: tokens.length > 0 ? tokens[0].risco : null
                    };

                    // Etapa 4.1: Converter emblemas em saldo se for encontrado algum token para o usuário
                    if (tokens.length > 0) {
                        const saldoAtualizado = Number(usuarioOrganizado.saldo) + Number(usuarioOrganizado.emblemas);
                        await ConverterEmblemasModel.converterEmblemas(usuarioOrganizado.usuario_id, saldoAtualizado);
                        // Atualizar os dados em memória para refletir o novo saldo
                        usuarioOrganizado.saldo = saldoAtualizado;
                        usuarioComPorcentagens.saldo = saldoAtualizado;
                        usuarioComTokens.saldo = saldoAtualizado;
                        logger.info(`Etapa 4.1: Emblemas convertidos para o usuário ${usuarioOrganizado.usuario_id}. Novo saldo: ${saldoAtualizado}`);
                    }

                    // Etapa 5: Calcular distribuição percentual dos tokens por risco e perfil
                    const calcularDistribuicao = () => {
                        const riscos = {};
                        const perfis = {};

                        if (tokens.length === 0) {
                            logger.warn(`Usuário ${usuarioComTokens.usuario_id} não possui tokens`);
                            return {
                                ...usuarioComTokens,
                                distribuicao: {},
                                distribuicao_perfil: {}
                            };
                        }

                        const totalTokens = tokens.reduce((acc, token) => acc + token.quantidade_tokens, 0);

                        tokens.reduce((acc, token) => {
                            acc[token.risco] = (token.quantidade_tokens / totalTokens) * 100;
                            return acc;
                        }, riscos);

                        // Ajuste para garantir que o total seja 100%
                        const totalCalculado = Object.values(riscos).reduce((acc, value) => acc + value, 0);
                        if (Math.round(totalCalculado) !== 100) {
                            const ajuste = 100 - totalCalculado;
                            const maiorRisco = Object.keys(riscos).reduce((a, b) =>
                                riscos[a] > riscos[b] ? a : b
                            );
                            riscos[maiorRisco] += ajuste;
                        }

                        // Calculando distribuição por perfil
                        Object.keys(riscos).reduce((acc, risco) => {
                            const perfil = ratings.find(r => r.rating === risco)?.perfil || 'Não Classificado';
                            acc[perfil] = (acc[perfil] || 0) + riscos[risco];
                            return acc;
                        }, perfis);

                        Object.keys(perfis).forEach(perfil => {
                            perfis[perfil] = Number(perfis[perfil].toFixed(2));
                        });

                        logger.info(`Distribuição de tokens para o usuário ${usuarioComTokens.usuario_id}:`);
                        logger.info(JSON.stringify({ distribuicao: riscos, distribuicao_perfil: perfis }, null, 2));

                        return {
                            ...usuarioComTokens,
                            distribuicao: riscos,
                            distribuicao_perfil: perfis
                        };
                    };

                    const usuarioComDistribuicao = calcularDistribuicao();

                    // Etapa 6: Buscar tokens disponíveis com base no ranking do usuário
                    const rankingUsuario = rankings.find(r => r.nomeRanking === usuarioComDistribuicao.ranking);
                    if (!rankingUsuario) {
                        logger.warn(`Ranking não encontrado para o usuário ${usuarioComDistribuicao.usuario_id}`);
                        return usuarioComDistribuicao;
                    }

                    logger.info(
                        `Ranking do usuário ${usuarioComDistribuicao.usuario_id}: ${rankingUsuario.nomeRanking} | AcessoInvestimentos: ${rankingUsuario.acessoInvestimentos.join(', ')}`
                    );
                    
                    const riscos = rankingUsuario.acessoInvestimentos;
                    const tokensDisponiveis = await BuscarPinsDisponiveisModel.getPins(riscos);

                    // Etapa 7: Equilibrar a carteira com base nas porcentagens desejadas
                    const equilibrarCarteira = async () => {
                        // Utilize o saldo atualizado do objeto (usuarioComDistribuicao.saldo)
                        let saldo = usuarioComDistribuicao.saldo || 0;

                        if (saldo <= 0) {
                            logger.warn('-------------------------');
                            logger.warn(`Usuário ${usuarioComDistribuicao.usuario_id} - Saldo insuficiente para realizar compras`);
                            return {
                                ...usuarioComDistribuicao,
                                ajustes: [{
                                    acao: 'Análise',
                                    descricao: 'Saldo insuficiente',
                                    recomendacao: 'Necessário recarregar o saldo para realizar compras'
                                }]
                            };
                        }

                        const targetPerfil = {
                            Conservador: usuarioComDistribuicao.porcentagem_pin_conservador,
                            Moderado: usuarioComDistribuicao.porcentagem_pin_moderado,
                            Agressivo: usuarioComDistribuicao.porcentagem_pin_agressivo
                        };

                        const comprarTokensPorPerfil = async (perfil, valorCompra) => {
                            const tokensDoPerfil = tokensDisponiveis.filter(token => {
                                const riscoToken = token.risco;
                                const perfilToken = ratings.find(r => r.rating === riscoToken)?.perfil || 'Não Classificado';
                                return perfilToken === perfil;
                            });

                            const tokenPrice = 0.01; // Valor unitário do token
                            let totalTokensPossiveis = Math.floor(valorCompra / tokenPrice);

                            for (const token of tokensDoPerfil) {
                                if (totalTokensPossiveis > 0) {
                                    try {
                                        const releaseMutex = await mutex.acquire();
                                        try {
                                            await sleep(1000);

                                            const tokensUsuario = await UsersTokensModel.tokensUsuario(usuarioComDistribuicao.usuario_id);
                                            const tokenAtual = tokensUsuario.find(t => t.token_id === token.token_id);
                                            const quantidadeAtual = tokenAtual ? tokenAtual.quantidade_tokens : 0;

                                            if (token.quantidade_tokens === 0) {
                                                logger.warn('-------------------------');
                                                logger.warn(`Token ${token.token_id} não está disponível para compra.`);
                                                continue;
                                            }

                                            // Ajustar a quantidade total de tokens para não exceder o saldo e a quantidade disponível
                                            const maxTokensParaComprar = Math.floor(saldo / tokenPrice);
                                            const quantidadeParaComprar = Math.min(totalTokensPossiveis, maxTokensParaComprar, token.quantidade_tokens);

                                            if (quantidadeParaComprar <= 0) {
                                                continue;
                                            }

                                            const quantidadeTotal = quantidadeAtual + quantidadeParaComprar;

                                            // Pré-leituras fora da transação (mutex já garante exclusão)
                                            const tokensIPO = await BuscarPinsDisponiveisModel.getPins(riscos);
                                            const tokenAtualIPO = tokensIPO.find(t => t.token_id === token.token_id);
                                            const quantidadeTokensIPO = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
                                            const quantidadeIPO = quantidadeTokensIPO - quantidadeParaComprar;

                                            const saldo_usuario = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
                                            const saldo_atual = parseFloat(saldo_usuario.saldo);
                                            saldo = saldo_atual - (quantidadeParaComprar * tokenPrice);

                                            // Escritas atômicas: tokens usuário + transação + tokens IPO + saldo
                                            await withTransaction(async (conn) => {
                                                await AtualizarQuantidadeTokensModel.atualizarQuantidadeTokens(
                                                    usuarioComDistribuicao.usuario_id, token.token_id, quantidadeTotal, conn
                                                );
                                                await AtualizarQuantidadeTokensModel.gravarTransacao(
                                                    usuarioComDistribuicao.usuario_id, token.token_id, quantidadeParaComprar, conn
                                                );
                                                await AtualizarQuantidadeTokensModel.atualizarTokensIPO(
                                                    token.token_id, quantidadeIPO, conn
                                                );
                                                await AtualizarSaldoUsuariosModel.atualizarSaldo(
                                                    saldo, usuarioComDistribuicao.usuario_id, conn
                                                );
                                            });

                                            logger.info(`Compra executada: Token ID: ${token.token_id}, Quantidade: ${quantidadeParaComprar}`);

                                            // Atualizar a quantidade possível de tokens a serem comprados
                                            totalTokensPossiveis -= quantidadeParaComprar;
                                        } finally {
                                            releaseMutex();
                                        }
                                    } catch (error) {
                                        logger.error(`Erro ao comprar o token ${token.token_id}: ${error.message}`);
                                    }
                                }
                            }
                        };

                        // Primeiro, tentar comprar tokens de acordo com as porcentagens alvo
                        const valorParaConservador = saldo * (targetPerfil.Conservador / 100);
                        const valorParaModerado = saldo * (targetPerfil.Moderado / 100);
                        const valorParaAgressivo = saldo * (targetPerfil.Agressivo / 100);

                        await comprarTokensPorPerfil('Conservador', valorParaConservador);
                        await comprarTokensPorPerfil('Moderado', valorParaModerado);
                        await comprarTokensPorPerfil('Agressivo', valorParaAgressivo);

                        // Verificar saldo restante e gastar se for maior ou igual a 0.01
                        let saldoRestante = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
                        saldo = parseFloat(saldoRestante.saldo);

                        while (saldo >= 0.01) {
                            // Atualizar a lista de tokens disponíveis antes de tentar usar o saldo restante
                            const tokensDisponiveisAtualizados = await BuscarPinsDisponiveisModel.getPins(riscos);
                            
                            // Usar todo o saldo restante para comprar o primeiro token disponível
                            const primeiroToken = tokensDisponiveisAtualizados[0];
                            if (!primeiroToken) {
                                break;
                            }

                            const tokenPrice = 0.01; // Valor unitário do token
                            const quantidadeParaComprar = Math.floor(saldo / tokenPrice);

                            // Verificar se a quantidade disponível é suficiente
                            const quantidadeDisponivel = primeiroToken.quantidade_tokens;
                            const quantidadeCompravel = Math.min(quantidadeParaComprar, quantidadeDisponivel);

                            if (quantidadeCompravel > 0) {
                                const releaseMutex = await mutex.acquire();
                                try {
                                    await sleep(1000);

                                    const tokensUsuario = await UsersTokensModel.tokensUsuario(usuarioComDistribuicao.usuario_id);
                                    const tokenAtual = tokensUsuario.find(t => t.token_id === primeiroToken.token_id);
                                    const quantidadeAtual = tokenAtual ? tokenAtual.quantidade_tokens : 0;

                                    const quantidadeTotal = quantidadeAtual + quantidadeCompravel;

                                    // Pré-leituras fora da transação (mutex já garante exclusão)
                                    const tokensIPO = await BuscarPinsDisponiveisModel.getPins(riscos);
                                    const tokenAtualIPO = tokensIPO.find(t => t.token_id === primeiroToken.token_id);
                                    const quantidadeTokensIPO = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
                                    const quantidadeIPO = quantidadeTokensIPO - quantidadeCompravel;

                                    saldo -= (quantidadeCompravel * tokenPrice);

                                    // Escritas atômicas: tokens usuário + transação + tokens IPO + saldo
                                    await withTransaction(async (conn) => {
                                        await AtualizarQuantidadeTokensModel.atualizarQuantidadeTokens(
                                            usuarioComDistribuicao.usuario_id, primeiroToken.token_id, quantidadeTotal, conn
                                        );
                                        await AtualizarQuantidadeTokensModel.gravarTransacao(
                                            usuarioComDistribuicao.usuario_id, primeiroToken.token_id, quantidadeCompravel, conn
                                        );
                                        await AtualizarQuantidadeTokensModel.atualizarTokensIPO(
                                            primeiroToken.token_id, quantidadeIPO, conn
                                        );
                                        await AtualizarSaldoUsuariosModel.atualizarSaldo(
                                            saldo, usuarioComDistribuicao.usuario_id, conn
                                        );
                                    });

                                    logger.info(`Compra executada com saldo restante: Token ID: ${primeiroToken.token_id}, Quantidade: ${quantidadeCompravel}`);
                                } finally {
                                    releaseMutex();
                                }
                            }

                            // Atualizar saldo restante
                            saldoRestante = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
                            saldo = parseFloat(saldoRestante.saldo);
                        }

                        return {
                            ...usuarioComDistribuicao,
                            ajustes: []
                        };
                    };

                    const usuarioComAjustes = await equilibrarCarteira();

                    logger.info('-------------------------');
                    logger.info(`Finalizado processamento do usuário ${usuarioComAjustes.usuario_id}`);
                    logger.info('Ajustes realizados:');
                    logger.info(JSON.stringify(usuarioComAjustes.ajustes, null, 2));

                    return usuarioComAjustes;
                } catch (error) {
                    logger.error(`Erro ao processar o usuário ${usuario.usuario_id}: ${error.message}`);
                    return {
                        ...usuario,
                        error: 'Erro ao processar o usuário',
                        message: 'Ocorreu um erro durante o processamento.'
                    };
                }
            };

            // Processamento sequencial dos usuários
            const processarTodosUsuarios = async (usuariosPro, usuariosBasic) => {
                const resultados = {
                    usuariosPro: [],
                    usuariosBasic: [],
                    outros: []
                };

                for (const usuario of usuariosPro) {
                    try {
                        const usuarioProcessado = await processarUsuario(usuario);
                        await sleep(5000); // Pausa de 5 segundos
                        resultados.usuariosPro.push(usuarioProcessado);
                    } catch (error) {
                        logger.error(`Erro ao processar o usuário ${usuario.usuario_id}: ${error.message}`);
                        resultados.usuariosPro.push({
                            ...usuario,
                            error: 'Erro ao processar o usuário',
                            message: 'Ocorreu um erro durante o processamento.'
                        });
                    }
                }

                for (const usuario of usuariosBasic) {
                    try {
                        const usuarioProcessado = await processarUsuario(usuario);
                        await sleep(5000);
                        resultados.usuariosBasic.push(usuarioProcessado);
                    } catch (error) {
                        logger.error(`Erro ao processar o usuário ${usuario.usuario_id}: ${error.message}`);
                        resultados.usuariosBasic.push({
                            ...usuario,
                            error: 'Erro ao processar o usuário',
                            message: 'Ocorreu um erro durante o processamento.'
                        });
                    }
                }

                return resultados;
            };

            const resultados = await processarTodosUsuarios(usuariosPro, usuariosBasic);

            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                usuariosPro: resultados.usuariosPro,
                usuariosBasic: resultados.usuariosBasic,
                outros: resultados.outros,
                totalUsuariosPro: resultados.usuariosPro.length,
                totalUsuariosBasic: resultados.usuariosBasic.length,
            });
        } catch (error) {
            logger.error('Erro ao processar os usuários:', error);
            return res.status(500).json({
                error: 'Erro ao processar os usuários',
                message: 'Ocorreu um erro ao processar os usuários sequencialmente',
            });
        }
    }
};

module.exports = CompraDiariaPinsController;

