// controllers/rotinas/controller_poppy_compra_diaria_pins.js
const Mutex = require('async-mutex').Mutex;
const logger = require('../../logger');
const { withTransaction } = require('../../database/transaction');
const BuscarUsuariosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_usuarios_e_carteiras');
const carteiras = require('./carteiras');
const UsersTokensModel = require('../../models/usuarios/model_tokens_usuarios');
const ratings = require('./ratings');
const BuscarPinsDisponiveisModel = require('../../models/rotinas/model_poppy_buscar_pins_disponiveis');
const BuscarTokensEmbAtivosModel = require('../../models/rotinas/model_poppy_buscar_tokens_emb_ativos');
const AtualizarQuantidadeTokensModel = require('../../models/rotinas/model_poppy_comprar_pins_disponiveis');
const UsersSaldosModel = require('../../models/usuarios/model_saldos_usuarios');
const AtualizarSaldoUsuariosModel = require('../../models/rotinas/model_poppy_atualizar_saldo_usuarios');
const ligaAcessoInvestimentos = require('../../public/js/usuarios/acesso_investimentos_por_liga');
const ligas = ligaAcessoInvestimentos.default; // Acessa o array exportado pelo módulo

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

// Criar um mutex para controlar o acesso concorrente
const mutex = new Mutex();

const CompraDiariaPinsController = {
    async executarCompraDiariaPins(req, res) {
        logger.info('Iniciando a coleta e processamento sequencial de usuários');

        try {
            // Etapa 1: Importar ligas e acessos correspondentes
            logger.info('Importando ligas e acessos correspondentes');

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
                        saldo: usuario.saldo,
                        liga: usuario.liga
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
                            logger.info(`Split Empresas/Emblemas: ${carteira.porcentagem_empresas}% / ${carteira.porcentagem_emblemas}%`);
                            logger.info(`Porcentagens pré-definidas: ${carteira.porcentagem_pin_conservador}% Conservador, ${carteira.porcentagem_pin_moderado}% Moderado, ${carteira.porcentagem_pin_agressivo}% Agressivo`);

                            return {
                                ...usuarioOrganizado,
                                porcentagem_empresas: carteira.porcentagem_empresas,
                                porcentagem_emblemas: carteira.porcentagem_emblemas,
                                porcentagem_pin_conservador: carteira.porcentagem_pin_conservador,
                                porcentagem_pin_moderado: carteira.porcentagem_pin_moderado,
                                porcentagem_pin_agressivo: carteira.porcentagem_pin_agressivo
                            };
                        }

                        // Padrão conservador se não encontrar perfil
                        const defaultCarteira = {
                            porcentagem_empresas: 50,
                            porcentagem_emblemas: 50,
                            porcentagem_pin_conservador: 50,
                            porcentagem_pin_moderado: 30,
                            porcentagem_pin_agressivo: 20
                        };

                        logger.warn(`Nenhuma carteira encontrada para o usuário ${usuarioOrganizado.usuario_id}`);
                        logger.warn(`Utilizando carteira padrão: ${defaultCarteira.porcentagem_empresas}% Empresas, ${defaultCarteira.porcentagem_emblemas}% Emblemas`);

                        return {
                            ...usuarioOrganizado,
                            ...defaultCarteira
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

                    // Etapa 6: Buscar tokens disponíveis com base na liga do usuário
                    const ligaUsuario = ligas.find(r => r.nomeLiga === usuarioComDistribuicao.liga);
                    if (!ligaUsuario) {
                        logger.warn(`Liga não encontrada para o usuário ${usuarioComDistribuicao.usuario_id}`);
                        return usuarioComDistribuicao;
                    }

                    logger.info(
                        `Liga do usuário ${usuarioComDistribuicao.usuario_id}: ${ligaUsuario.nomeLiga} | AcessoInvestimentos: ${ligaUsuario.acessoInvestimentos.join(', ')}`
                    );

                    const riscos = ligaUsuario.acessoInvestimentos;
                    const tokensDisponiveis = await BuscarPinsDisponiveisModel.getPins(riscos);

                    // Tokens EMB: buscados diretamente da tabela tokens — a Purg não possui estoque deles
                    const tokensEmbAtivos = await BuscarTokensEmbAtivosModel.getTokensEmb();

                    // Etapa 7: Equilibrar a carteira com base nas porcentagens desejadas
                    const equilibrarCarteira = async () => {
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

                        // --- Split do saldo entre Empresas e Emblemas ---
                        const saldoParaEmpresas = saldo * (usuarioComDistribuicao.porcentagem_empresas / 100);
                        const saldoParaEmblemas = saldo * (usuarioComDistribuicao.porcentagem_emblemas / 100);

                        logger.info(`Usuário ${usuarioComDistribuicao.usuario_id} - Split de saldo:`);
                        logger.info(`  Empresas (${usuarioComDistribuicao.porcentagem_empresas}%): R$ ${saldoParaEmpresas.toFixed(8)}`);
                        logger.info(`  Emblemas (${usuarioComDistribuicao.porcentagem_emblemas}%): R$ ${saldoParaEmblemas.toFixed(8)}`);

                        // Porcentagens dos perfis de empresa aplicadas sobre a parcela de empresas
                        const targetPerfil = {
                            Conservador: usuarioComDistribuicao.porcentagem_pin_conservador,
                            Moderado: usuarioComDistribuicao.porcentagem_pin_moderado,
                            Agressivo: usuarioComDistribuicao.porcentagem_pin_agressivo
                        };

                        const comprarTokensPorPerfil = async (perfil, valorCompra) => {
                            // Pins de Emblema têm quantidade ilimitada: não consomem estoque do IPO
                            // e são buscados diretamente da tabela tokens (a Purg nunca os possui)
                            const isEMB = perfil === 'Emblema';

                            const listaBase = isEMB
                                ? tokensEmbAtivos
                                : tokensDisponiveis.filter(token => {
                                    const perfilToken = ratings.find(r => r.rating === token.risco)?.perfil || 'Não Classificado';
                                    return perfilToken === perfil;
                                });

                            if (listaBase.length === 0) return;

                            const tokenPrice = 0.01;
                            let orcamento = Math.floor(valorCompra / tokenPrice); // em unidades de token
                            if (orcamento <= 0) return;

                            logger.info(`[${perfil}] Iniciando compra distribuída: ${orcamento} tokens entre ${listaBase.length} pin(s)`);

                            // Mapa de estoque local por token_id (Infinity para EMB — sem limite)
                            const estoque = new Map(listaBase.map(t => [t.token_id, isEMB ? Infinity : t.quantidade_tokens]));

                            // Distribui em rodadas: cada rodada divide o orçamento restante
                            // igualmente entre os tokens que ainda têm estoque. Tokens que
                            // não conseguem absorver a cota inteira devolvem o excesso para
                            // a próxima rodada, garantindo distribuição uniforme.
                            while (orcamento > 0) {
                                const tokensAtivos = listaBase.filter(t => estoque.get(t.token_id) > 0);
                                if (tokensAtivos.length === 0) break;

                                const qtdBase = Math.floor(orcamento / tokensAtivos.length);
                                const extra   = orcamento % tokensAtivos.length;
                                let compradoNoLoop = 0;

                                for (let i = 0; i < tokensAtivos.length; i++) {
                                    if (orcamento <= 0) break;
                                    const token = tokensAtivos[i];

                                    // Cota deste token: base + 1 extra para os primeiros (distribui o resto)
                                    const alocado = qtdBase + (i < extra ? 1 : 0);
                                    const disponivelToken = estoque.get(token.token_id);
                                    const qtd = Math.min(alocado, disponivelToken, orcamento);
                                    if (qtd <= 0) continue;

                                    const releaseMutex = await mutex.acquire();
                                    try {
                                        await sleep(1000);

                                        const tokensUsuario = await UsersTokensModel.tokensUsuario(usuarioComDistribuicao.usuario_id);
                                        const tokenAtual = tokensUsuario.find(t => t.token_id === token.token_id);
                                        const quantidadeAtual = tokenAtual ? tokenAtual.quantidade_tokens : 0;
                                        const quantidadeTotal = quantidadeAtual + qtd;

                                        const saldo_usuario = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
                                        saldo = parseFloat(saldo_usuario.saldo) - (qtd * tokenPrice);

                                        await withTransaction(async (conn) => {
                                            await AtualizarQuantidadeTokensModel.atualizarQuantidadeTokens(
                                                usuarioComDistribuicao.usuario_id, token.token_id, quantidadeTotal, conn
                                            );
                                            await AtualizarQuantidadeTokensModel.gravarTransacao(
                                                usuarioComDistribuicao.usuario_id, token.token_id, qtd, conn
                                            );
                                            // EMB: estoque do IPO não é decrementado (quantidade ilimitada)
                                            if (!isEMB) {
                                                const tokensIPO = await BuscarPinsDisponiveisModel.getPins(riscos);
                                                const tokenAtualIPO = tokensIPO.find(t => t.token_id === token.token_id);
                                                const qtdIPO = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
                                                await AtualizarQuantidadeTokensModel.atualizarTokensIPO(
                                                    token.token_id, qtdIPO - qtd, conn
                                                );
                                            }
                                            await AtualizarSaldoUsuariosModel.atualizarSaldo(
                                                saldo, usuarioComDistribuicao.usuario_id, conn
                                            );
                                        });

                                        logger.info(`Compra executada: Token ID ${token.token_id} (${perfil}${isEMB ? ', ilimitado' : ''}), qtd: ${qtd}`);
                                        estoque.set(token.token_id, disponivelToken - qtd);
                                        orcamento -= qtd;
                                        compradoNoLoop += qtd;
                                    } catch (error) {
                                        logger.error(`Erro ao comprar o token ${token.token_id}: ${error.message}`);
                                    } finally {
                                        releaseMutex();
                                    }
                                }

                                // Nenhum token absorveu nada nesta rodada — evita loop infinito
                                if (compradoNoLoop === 0) break;
                            }
                        };

                        // --- Comprar Pins de Empresas (Conservador / Moderado / Agressivo) ---
                        const valorParaConservador = saldoParaEmpresas * (targetPerfil.Conservador / 100);
                        const valorParaModerado    = saldoParaEmpresas * (targetPerfil.Moderado / 100);
                        const valorParaAgressivo   = saldoParaEmpresas * (targetPerfil.Agressivo / 100);

                        await comprarTokensPorPerfil('Conservador', valorParaConservador);
                        await comprarTokensPorPerfil('Moderado', valorParaModerado);
                        await comprarTokensPorPerfil('Agressivo', valorParaAgressivo);

                        // --- Comprar Pins de Emblema (tipo EMB) ---
                        await comprarTokensPorPerfil('Emblema', saldoParaEmblemas);

                        // Verificar saldo restante e gastar se for maior ou igual a 0.01
                        // Distribui o residual em round-robin pelos tokens disponíveis (sem EMB)
                        let saldoRestante = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
                        saldo = parseFloat(saldoRestante.saldo);

                        let indiceResidual = 0; // controla qual token receberá o próximo token residual
                        while (saldo >= 0.01) {
                            const tokensDisponiveisAtualizados = await BuscarPinsDisponiveisModel.getPins(riscos);

                            // Pular tokens EMB no while-loop: EMB não usa estoque da Purg
                            const tokensEmpresaResidual = tokensDisponiveisAtualizados.filter(t => t.risco !== 'EMB');
                            if (tokensEmpresaResidual.length === 0) break;

                            // Round-robin: avança pelo índice para não concentrar sempre no mesmo token
                            indiceResidual = indiceResidual % tokensEmpresaResidual.length;
                            const tokenResidual = tokensEmpresaResidual[indiceResidual];
                            indiceResidual++;

                            const tokenPrice = 0.01;
                            const quantidadeParaComprar = Math.floor(saldo / tokenPrice);
                            const quantidadeCompravel = Math.min(quantidadeParaComprar, tokenResidual.quantidade_tokens);

                            if (quantidadeCompravel > 0) {
                                const releaseMutex = await mutex.acquire();
                                try {
                                    await sleep(1000);

                                    const tokensUsuario = await UsersTokensModel.tokensUsuario(usuarioComDistribuicao.usuario_id);
                                    const tokenAtual = tokensUsuario.find(t => t.token_id === tokenResidual.token_id);
                                    const quantidadeAtual = tokenAtual ? tokenAtual.quantidade_tokens : 0;
                                    const quantidadeTotal = quantidadeAtual + quantidadeCompravel;

                                    const tokensIPO = await BuscarPinsDisponiveisModel.getPins(riscos);
                                    const tokenAtualIPO = tokensIPO.find(t => t.token_id === tokenResidual.token_id);
                                    const quantidadeTokensIPO = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
                                    const quantidadeIPO = quantidadeTokensIPO - quantidadeCompravel;

                                    saldo -= (quantidadeCompravel * tokenPrice);

                                    await withTransaction(async (conn) => {
                                        await AtualizarQuantidadeTokensModel.atualizarQuantidadeTokens(
                                            usuarioComDistribuicao.usuario_id, tokenResidual.token_id, quantidadeTotal, conn
                                        );
                                        await AtualizarQuantidadeTokensModel.gravarTransacao(
                                            usuarioComDistribuicao.usuario_id, tokenResidual.token_id, quantidadeCompravel, conn
                                        );
                                        await AtualizarQuantidadeTokensModel.atualizarTokensIPO(
                                            tokenResidual.token_id, quantidadeIPO, conn
                                        );
                                        await AtualizarSaldoUsuariosModel.atualizarSaldo(
                                            saldo, usuarioComDistribuicao.usuario_id, conn
                                        );
                                    });

                                    logger.info(`Compra residual: Token ID ${tokenResidual.token_id}, qtd: ${quantidadeCompravel}`);
                                } finally {
                                    releaseMutex();
                                }
                            } else {
                                // Token sem estoque suficiente — avança para o próximo sem decrementar índice
                                if (tokensEmpresaResidual.every(t => t.quantidade_tokens === 0)) break;
                            }

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
                        await sleep(5000);
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
