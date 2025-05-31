const logger = require('../../logger');
const BuscarUsuariosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_usuarios_e_carteiras');
const carteiras = require('./carteiras');
const UsersTokensModel = require('../../models/usuarios/model_tokens_usuarios');
const ratings = require('./ratings');
const BuscarPinsDisponiveisModel = require('../../models/rotinas/model_poppy_buscar_pins_disponiveis');
const AtualizarQuantidadeTokensModel = require('../../models/rotinas/model_poppy_comprar_pins_disponiveis');
const UsersSaldosModel = require('../../models/usuarios/model_saldos_usuarios');
const AtualizarSaldoUsuariosModel = require('../../models/rotinas/model_poppy_atualizar_saldo_usuarios');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const CompraDiariaPinsController = {
    async executarCompraDiariaPins(req, res) {
        logger.info('Iniciando a coleta e processamento sequencial de usuários');

        try {
            // Etapa 1: Buscar usuários e carteiras
            const usuariosCarteiras = await BuscarUsuariosCarteirasModel.getUsuariosCarteiras();

            if (!usuariosCarteiras.length) {
                logger.warn('Nenhum usuário ativo encontrado');
                return res.status(200).json({
                    message: 'Nenhum usuário ativo encontrado.',
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
                logger.info(`Dados do usuário:`);
                logger.info(JSON.stringify(usuario, null, 2));

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

            logger.info(`Usuários Pro encontrados: ${usuariosPro.length}`);
            logger.info(`Usuários Basic encontrados: ${usuariosBasic.length}`);
            logger.info(`Outros usuários encontrados: ${outros.length}`);

            // Função para processar um usuário
            const processarUsuario = async (usuario) => {
                try {
                    // Etapa 2: Organizar usuário
                    const usuarioOrganizado = {
                        usuario_id: usuario.usuario_id,
                        investido: usuario.investido,
                        suitability: usuario.suitability,
                        suitability_complementar: usuario.suitability_complementar,
                        saldo: usuario.saldo // Garantindo que o saldo está incluso
                    };

                    logger.info(`-------------------------`);
                    logger.info(`Dados do usuário organizado:`);
                    logger.info(JSON.stringify(usuarioOrganizado, null, 2));

                    // Etapa 3: Definir porcentagens da carteira
                    const definirPorcentagens = () => {
                        const carteira = carteiras.find(c => 
                            c.suitability === usuarioOrganizado.suitability && 
                            c.suitability_complementar === usuarioOrganizado.suitability_complementar
                        );
                        
                        if (carteira) {
                            logger.info(`-------------------------`);
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

                        tokens.forEach(token => {
                            riscos[token.risco] = (token.quantidade_tokens / totalTokens) * 100;
                        });

                        // Ajustando para garantir que o total seja 100%
                        const totalCalculado = Object.values(riscos).reduce((acc, value) => acc + value, 0);
                        if (Math.round(totalCalculado) !== 100) {
                            const ajuste = 100 - totalCalculado;
                            const maiorRisco = Object.keys(riscos).reduce((a, b) => 
                                riscos[a] > riscos[b] ? a : b
                            );
                            riscos[maiorRisco] += ajuste;
                        }

                        // Calculando distribuição por perfil
                        Object.keys(riscos).forEach(risco => {
                            const perfil = ratings.find(r => r.rating === risco)?.perfil || 'Não Classificado';
                            const percentagem = riscos[risco];
                            
                            if (perfis[perfil]) {
                                perfis[perfil] += percentagem;
                            } else {
                                perfis[perfil] = percentagem;
                            }
                        });

                        Object.keys(perfis).forEach(perfil => {
                            perfis[perfil] = Number(perfis[perfil].toFixed(2));
                        });

                        logger.info(`Distribuição de tokens para o usuário ${usuarioComTokens.usuario_id}:`);
                        logger.info(JSON.stringify({
                            distribuicao: riscos,
                            distribuicao_perfil: perfis
                        }, null, 2));

                        return {
                            ...usuarioComTokens,
                            distribuicao: riscos,
                            distribuicao_perfil: perfis
                        };
                    };

                    const usuarioComDistribuicao = calcularDistribuicao();

                    // Etapa 6: Buscar tokens disponíveis
                    const tokensDisponiveis = await BuscarPinsDisponiveisModel.getPins();

                    // Etapa 7: Equilibrar a carteira com base nas porcentagens desejadas (APENAS COMPRAS)
                    const equilibrarCarteira = async () => {
                        const saldo = usuarioComDistribuicao.saldo || 0;

                        if (saldo <= 0) {
                            logger.warn(`-------------------------`);
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

                        const currentPerfil = {
                            Conservador: usuarioComDistribuicao.distribuicao_perfil?.Conservador || 0,
                            Moderado: usuarioComDistribuicao.distribuicao_perfil?.Moderado || 0,
                            Agressivo: usuarioComDistribuicao.distribuicao_perfil?.Agressivo || 0
                        };

                        const ajustes = [];

                        // Verificar se a carteira já está balanceada
                        const verificarBalanceamento = () => {
                            return Object.keys(targetPerfil).every(perfil => 
                                Math.round(currentPerfil[perfil]) === Math.round(targetPerfil[perfil])
                            );
                        };

                        if (verificarBalanceamento()) {
                            logger.info(`-------------------------`);
                            logger.info(`A carteira do usuário ${usuarioComDistribuicao.usuario_id} já está balanceada`);
                            
                            // Utilizar o saldo remanescente para comprar mais tokens mantendo o balanceamento
                            const saldoUtilizado = saldo; // Saldo total disponível para compra

                            if (saldoUtilizado > 0) {
                                logger.info(`-------------------------`);
                                logger.info(`Usuário ${usuarioComDistribuicao.usuario_id} - Utilizando saldo remanescente para compra adicional de tokens`);
                                // Calcular quantos tokens comprar em cada perfil
                                const tokensDisponiveis = await BuscarPinsDisponiveisModel.getPins();
                                
                                const comprarTokensAdicionais = async () => {
                                    try {
                                        const tokenPrice = 0.01; // Valor unitário do token
                                        const totalTokensPossiveis = Math.floor(saldoUtilizado / tokenPrice);
                                        
                                        // Distribuir os tokens de acordo com as porcentagens
                                        const tokensPorPerfil = {
                                            Conservador: Math.floor((targetPerfil.Conservador / 100) * totalTokensPossiveis),
                                            Moderado: Math.floor((targetPerfil.Moderado / 100) * totalTokensPossiveis),
                                            Agressivo: Math.floor((targetPerfil.Agressivo / 100) * totalTokensPossiveis)
                                        };

                                        // Ajustar para garantir que o total seja igual ao totalTokensPossiveis
                                        const totalTokens = Object.values(tokensPorPerfil).reduce((acc, value) => acc + value, 0);
                                        if (totalTokens < totalTokensPossiveis) {
                                            // Distribuir os tokens restantes proporcionalmente
                                            const tokensRestantes = totalTokensPossiveis - totalTokens;
                                            const perfis = Object.keys(tokensPorPerfil);
                                            
                                            for (let i = 0; i < tokensRestantes; i++) {
                                                const perfil = perfis[i % perfis.length];
                                                tokensPorPerfil[perfil]++;
                                            }
                                        }

                                        logger.info(`-------------------------`);
                                        logger.info(`Distribuição adicional de tokens:`);
                                        logger.info(JSON.stringify(tokensPorPerfil, null, 2));

                                        // Comprar tokens para cada perfil
                                        for (const [perfil, quantidade] of Object.entries(tokensPorPerfil)) {
                                            if (quantidade > 0) {
                                                const tokensDoPerfil = tokensDisponiveis.filter(token => {
                                                    const riscoToken = token.risco;
                                                    const perfilToken = ratings.find(r => r.rating === riscoToken)?.perfil || 'Não Classificado';
                                                    return perfilToken === perfil;
                                                });

                                                if (tokensDoPerfil.length > 0) {
                                                    // Distribuir a compra entre os tokens disponíveis
                                                    const tokensPorToken = Math.floor(quantidade / tokensDoPerfil.length);
                                                    
                                                    for (const token of tokensDoPerfil) {
                                                        try {
                                                            // Obter todos os tokens do usuário
                                                            const tokensUsuario = await UsersTokensModel.tokensUsuario(usuarioComDistribuicao.usuario_id);
                                                            
                                                            // Encontrar a quantidade atual do token específico
                                                            const tokenAtual = tokensUsuario.find(t => t.token_id === token.token_id);
                                                            const quantidadeAtual = tokenAtual ? tokenAtual.quantidade_tokens : 0;

                                                            // Verificar disponibilidade global do token
                                                            if (token.quantidade_tokens === 0) {
                                                                logger.warn(`-------------------------`);
                                                                logger.warn(`Tokem ${token.token_id} não está disponível para compra.`);
                                                                continue;
                                                            }

                                                            // Calcular a nova quantidade total
                                                            const quantidadeTotal = quantidadeAtual + tokensPorToken;

                                                            // Atualizar a quantidade total
                                                            const resultado = await AtualizarQuantidadeTokensModel.atualizarQuantidadeTokens(
                                                                usuarioComDistribuicao.usuario_id,
                                                                token.token_id,
                                                                quantidadeTotal
                                                            );
                                                            
                                                            // Gravar transação após a atualização bem-sucedida
                                                            await AtualizarQuantidadeTokensModel.gravarTransacao(
                                                                usuarioComDistribuicao.usuario_id,
                                                                token.token_id,
                                                                tokensPorToken
                                                            );

                                                            // Definir o novo valor do token do IPO
                                                           const tokensIPO = await BuscarPinsDisponiveisModel.getPins();
                                                           const tokenAtualIPO = tokensIPO.find(t => t.token_id === token.token_id);
                                                           const quantidadeTokensIPO = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
                                                        
                                                           // Calcular a nova quantidade total
                                                           const quantidadeIPO = quantidadeTokensIPO - tokensPorToken;

                                                            // Chamada à nova função atualizarTokensIPO
                                                            await AtualizarQuantidadeTokensModel.atualizarTokensIPO(
                                                                token.token_id,
                                                                quantidadeIPO
                                                            );

                                                            // Calcular o novo saldo atualizado
                                                            const saldo_usuario = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
                                                            if (!saldo_usuario) {
                                                                logger.error('Erro: Saldo não encontrado para o usuário ' + usuarioComDistribuicao.usuario_id);
                                                                throw new Error('Saldo não encontrado');
                                                            }
                                                            const saldo_atual = parseFloat(saldo_usuario.saldo);
                                                            const saldo_atualizado = saldo_atual - (tokensPorToken * 0.01);
                                                            logger.info(`Saldo atualizado: ${saldo_atualizado}`);
                                                            // Aguarde a atualização do saldo ser concluída
                                                            await AtualizarSaldoUsuariosModel.atualizarSaldo(saldo_atualizado, usuarioComDistribuicao.usuario_id);

                                                            ajustes.push({
                                                                perfil,
                                                                acao: 'Comprar',
                                                                token_id: token.token_id,
                                                                quantidade: tokensPorToken,
                                                                valor: tokensPorToken * 0.01,
                                                                token: token
                                                            });
                                                            
                                                            logger.info(`-------------------------`);
                                                            logger.info(`Compra adicional executada com sucesso:`);
                                                            logger.info(`Usuário: ${usuarioComDistribuicao.usuario_id}`);
                                                            logger.info(`Token ID: ${token.token_id}`);
                                                            logger.info(`Quantidade comprada: ${tokensPorToken}`);
                                                            logger.info(`Resultado da atualização: ${JSON.stringify(resultado)}`);
                                                            logger.info(`Registro de transação criado com sucesso:`);
                                                            logger.info(`Usuário: ${usuarioComDistribuicao.usuario_id}`);
                                                            logger.info(`Token ID: ${token.token_id}`);
                                                            logger.info(`Quantidade sugerida: ${tokensPorToken}`);
                                                        } catch (error) {
                                                            logger.error(`Erro ao executar a compra adicional do token ${token.token_id} para o usuário ${usuarioComDistribuicao.usuario_id}:`, error);
                                                            ajustes.push({
                                                                perfil,
                                                                acao: 'Análise',
                                                                descricao: `Erro ao comprar o token ${token.token_id}`,
                                                                detalhes: error.message
                                                            });
                                                        }
                                                    }
                                                } else {
                                                    logger.warn(`-------------------------`);
                                                    logger.warn(`Usuário ${usuarioComDistribuicao.usuario_id} - Não há tokens disponíveis para o perfil ${perfil}`);
                                                    ajustes.push({
                                                        perfil,
                                                        acao: 'Análise',
                                                        descricao: `Nenhum token disponível para o perfil ${perfil}`,
                                                        recomendacao: `Revisar a disponibilidade de tokens ou ajustar o perfil`
                                                    });
                                                }
                                            }
                                        }
                                    } catch (error) {
                                        logger.error(`Erro ao comprar tokens adicionais para o usuário ${usuarioComDistribuicao.usuario_id}:`, error);
                                        ajustes.push({
                                            acao: 'Análise',
                                            descricao: `Erro ao comprar tokens adicionais`,
                                            detalhes: error.message
                                        });
                                    }
                                };

                                await comprarTokensAdicionais();
                            }
                        } else {
                            // Processo original de balanceamento
                            const filtrarTokensPorPerfil = async (tokensDisponiveis, targetPerfil, currentPerfil) => {
                                Object.entries(targetPerfil).forEach(async ([perfil, target]) => {
                                    const current = currentPerfil[perfil];
                                    const discrepencia = target - current;

                                    if (discrepencia > 0) {
                                        const tokensDoPerfil = tokensDisponiveis.filter(token => {
                                            const riscoToken = token.risco;
                                            const perfilToken = ratings.find(r => r.rating === riscoToken)?.perfil || 'Não Classificado';
                                            return perfilToken === perfil;
                                        });

                                        if (tokensDoPerfil.length > 0) {
                                            logger.info(`-------------------------`);
                                            logger.info(`Usuário ${usuarioComDistribuicao.usuario_id} - Tokens disponíveis para ${perfil}:`);
                                            logger.info(JSON.stringify(tokensDoPerfil, null, 2));

                                            const tokenPrice = 0.01; // Valor unitário do token
                                            const totalValor = (discrepencia * saldo) / 100;
                                            const tokensNecessarios = Math.floor(totalValor / tokenPrice);
                                            const tokensPorToken = Math.floor(tokensNecessarios / tokensDoPerfil.length);
                                            const valorPorToken = tokensPorToken * tokenPrice;

                                            if (tokensNecessarios > 0) {
                                                logger.info(`-------------------------`);
                                                logger.info(`Usuário ${usuarioComDistribuicao.usuario_id} - Distribuição equilibrada de compra de tokens de ${perfil}`);
                                                logger.info(`Valor total disponível para compra: R$ ${totalValor.toFixed(2)}`);
                                                logger.info(`Número de tokens disponíveis para compra: ${tokensDoPerfil.length}`);
                                                logger.info(`Quantidade de tokens por token: ${tokensPorToken}`);
                                                logger.info(`Valor por token: R$ ${valorPorToken.toFixed(2)}`);

                                                for (const token of tokensDoPerfil) {
                                                    try {
                                                        // Obter todos os tokens do usuário
                                                        const tokensUsuario = await UsersTokensModel.tokensUsuario(usuarioComDistribuicao.usuario_id);
                                                        
                                                        // Encontrar a quantidade atual do token específico
                                                        const tokenAtual = tokensUsuario.find(t => t.token_id === token.token_id);
                                                        const quantidadeAtual = tokenAtual ? tokenAtual.quantidade_tokens : 0;

                                                        // Verificar disponibilidade global do token
                                                        if (token.quantidade_tokens === 0) {
                                                            logger.warn(`-------------------------`);
                                                            logger.warn(`Tokem ${token.token_id} não está disponível para compra.`);
                                                            continue;
                                                        }

                                                        // Calcular a nova quantidade total
                                                        const quantidadeTotal = quantidadeAtual + tokensPorToken;

                                                        // Atualizar a quantidade total
                                                        const resultado = await AtualizarQuantidadeTokensModel.atualizarQuantidadeTokens(
                                                            usuarioComDistribuicao.usuario_id,
                                                            token.token_id,
                                                            quantidadeTotal
                                                        );

                                                        // Gravar transação após a atualização bem-sucedida
                                                        await AtualizarQuantidadeTokensModel.gravarTransacao(
                                                            usuarioComDistribuicao.usuario_id,
                                                            token.token_id,
                                                            tokensPorToken
                                                        );

                                                        // Definir o novo valor do token do IPO
                                                        const tokensIPO = await BuscarPinsDisponiveisModel.getPins();

                                                        const tokenAtualIPO = tokensIPO.find(t => t.token_id === token.token_id);
                                                        const quantidadeTokensIPO = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;

                                                        // Calcular a nova quantidade total
                                                        const quantidadeIPO = quantidadeTokensIPO - tokensPorToken;

                                                        // Chamada à nova função atualizarTokensIPO
                                                        await AtualizarQuantidadeTokensModel.atualizarTokensIPO(
                                                                token.token_id,
                                                                quantidadeIPO
                                                                );

                                                        // Calcular o novo saldo atualizado
                                                        const saldo_usuario = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
                                                        if (!saldo_usuario) {
                                                            logger.error(`Erro: Saldo não encontrado para o usuário ${usuarioComDistribuicao.usuario_id}`);
                                                            throw new Error('Saldo não encontrado');
                                                        }
                                                        const saldo_atual = parseFloat(saldo_usuario.saldo);
                                                        const saldo_atualizado = saldo_atual - (tokensPorToken * 0.01);
                                                        logger.info(`Saldo atualizado: ${saldo_atualizado}`);
                                                        // Aguarde a atualização do saldo ser concluída
                                                        await AtualizarSaldoUsuariosModel.atualizarSaldo(saldo_atualizado, usuarioComDistribuicao.usuario_id);

                                                        logger.info(`-------------------------`);
                                                        logger.info(`Compra executada com sucesso:`);
                                                        logger.info(`Usuário: ${usuarioComDistribuicao.usuario_id}`);
                                                        logger.info(`Token ID: ${token.token_id}`);
                                                        logger.info(`Quantidade comprada: ${tokensPorToken}`);
                                                        logger.info(`Resultado da atualização: ${JSON.stringify(resultado)}`);
                                                        logger.info(`Registro de transação criado com sucesso:`);
                                                        logger.info(`Usuário: ${usuarioComDistribuicao.usuario_id}`);
                                                        logger.info(`Token ID: ${token.token_id}`);
                                                        logger.info(`Quantidade sugerida: ${tokensPorToken}`);

                                                        ajustes.push({
                                                            perfil,
                                                            acao: 'Comprar',
                                                            token_id: token.token_id,
                                                            quantidade: tokensPorToken,
                                                            valor: valorPorToken,
                                                            token: token
                                                        });
                                                    } catch (error) {
                                                        logger.error(`Erro ao executar a compra do token ${token.token_id} para o usuário ${usuarioComDistribuicao.usuario_id}:`, error);
                                                        ajustes.push({
                                                            perfil,
                                                            acao: 'Análise',
                                                            descricao: `Erro ao comprar o token ${token.token_id}`,
                                                            detalhes: error.message
                                                        });
                                                    }
                                                }
                                            }
                                        } else {
                                            logger.warn(`-------------------------`);
                                            logger.warn(`Usuário ${usuarioComDistribuicao.usuario_id} - Não há tokens disponíveis para o perfil ${perfil}`);
                                            ajustes.push({
                                                perfil,
                                                acao: 'Análise',
                                                descricao: `Nenhum token disponível para o perfil ${perfil}`,
                                                recomendacao: `Revisar a disponibilidade de tokens ou ajustar o perfil`
                                            });
                                        }
                                    } else if (discrepencia < 0) {
                                        logger.warn(`-------------------------`);
                                        logger.warn(`Usuário ${usuarioComDistribuicao.usuario_id} - Excesso de tokens detectado:`);
                                        logger.warn(`Perfil: ${perfil}`);
                                        logger.warn(`Porcentagem atual: ${current}%`);
                                        logger.warn(`Porcentagem target: ${target}%`);
                                        logger.warn(`Discrepância: ${Math.abs(discrepencia)}%`);
                                        logger.warn(`Excesso de tokens no perfil ${perfil}. Idealmente deveria ter ${target}% e atualmente tem ${current}%.`);

                                        ajustes.push({
                                            perfil,
                                            acao: 'Análise',
                                            descricao: `Excesso de ${Math.abs(discrepencia)}% no perfil ${perfil}`,
                                            recomendacao: `Recomenda-se revisar a distribuição para ajustar o excesso.`
                                        });
                                    }
                                });
                            };

                            await filtrarTokensPorPerfil(tokensDisponiveis, targetPerfil, currentPerfil);

                            if (ajustes.length === 0) {
                                logger.info(`-------------------------`);
                                logger.info(`Usuário ${usuarioComDistribuicao.usuario_id} - Carteira já está equilibrada`);
                            }
                        }

                        return {
                            ...usuarioComDistribuicao,
                            ajustes
                        };
                    };

                    const usuarioComAjustes = await equilibrarCarteira();

                    // Logger para acompanhar o processamento
                    logger.info(`-------------------------`);
                    logger.info(`Finalizado processamento do usuário ${usuarioComAjustes.usuario_id}`);
                    logger.info(`Ajustes realizados:`);
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

            // Processando usuários sequencialmente com sleep
            const processarTodosUsuarios = async (listaUsuarios) => {
                const resultados = {
                    usuariosPro: [],
                    usuariosBasic: [],
                    outros: []
                };

                for (const usuario of listaUsuarios) {
                    try {
                        const usuarioProcessado = await processarUsuario(usuario);
                        
                        // Adicionar sleep após o processamento de cada usuário
                        await sleep(5000); // 5 segundos
                        
                        // Atribuir o usuário processado à sua categoria
                        if (usuario.assinatura === 'Poppy Pro') {
                            resultados.usuariosPro.push(usuarioProcessado);
                        } else if (usuario.assinatura === 'Poppy Basic') {
                            resultados.usuariosBasic.push(usuarioProcessado);
                        } else {
                            resultados.outros.push(usuarioProcessado);
                        }
                    } catch (error) {
                        logger.error(`Erro ao processar o usuário ${usuario.usuario_id}: ${error.message}`);
                        // Caso ocorra erro, ainda assim tenta manter a estrutura de resposta
                        if (usuario.assinatura === 'Poppy Pro') {
                            resultados.usuariosPro.push({
                                ...usuario,
                                error: 'Erro ao processar o usuário',
                                message: 'Ocorreu um erro durante o processamento.'
                            });
                        } else if (usuario.assinatura === 'Poppy Basic') {
                            resultados.usuariosBasic.push({
                                ...usuario,
                                error: 'Erro ao processar o usuário',
                                message: 'Ocorreu um erro durante o processamento.'
                            });
                        } else {
                            resultados.outros.push({
                                ...usuario,
                                error: 'Erro ao processar o usuário',
                                message: 'Ocorreu um erro durante o processamento.'
                            });
                        }
                    }
                }

                return resultados;
            };

            // Processar todos os usuários sequencialmente
            const resultados = await processarTodosUsuarios(usuariosCarteiras);

            // Retornar a resposta final
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
