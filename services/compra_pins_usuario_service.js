// services/compra_pins_usuario_service.js
// Executa a compra de pins para um único usuário.
// Usado tanto pela rotina diária (controller_poppy_compra_diaria_pins.js)
// quanto pelo webhook de depósito (controller_webhook_pix_efi) para
// garantir que o saldo nunca fique parado após um depósito confirmado.

'use strict';

const Mutex = require('async-mutex').Mutex;
const logger = require('../logger');
const { withTransaction } = require('../database/transaction');
const carteiras = require('../controllers/rotinas/carteiras');
const ratings = require('../controllers/rotinas/ratings');
const UsersTokensModel = require('../models/usuarios/model_tokens_usuarios');
const BuscarPinsDisponiveisModel = require('../models/rotinas/model_poppy_buscar_pins_disponiveis');
const BuscarTokensEmbAtivosModel = require('../models/rotinas/model_poppy_buscar_tokens_emb_ativos');
const AtualizarQuantidadeTokensModel = require('../models/rotinas/model_poppy_comprar_pins_disponiveis');
const UsersSaldosModel = require('../models/usuarios/model_saldos_usuarios');
const AtualizarSaldoUsuariosModel = require('../models/rotinas/model_poppy_atualizar_saldo_usuarios');
const ligaAcessoInvestimentos = require('../public/js/usuarios/acesso_investimentos_por_liga');
const ligas = ligaAcessoInvestimentos.default;

// Mutex compartilhado entre a rotina diária e os webhooks — evita compras concorrentes
const mutex = new Mutex();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processa a compra de pins para um único usuário.
 *
 * @param {Object} usuario - Dados do usuário conforme retornados pela tabela carteiras JOIN users
 *   Campos obrigatórios: usuario_id, saldo, investido, suitability, suitability_complementar, liga
 */
async function processarUsuario(usuario) {
    try {
        const usuarioOrganizado = {
            usuario_id:               usuario.usuario_id,
            investido:                usuario.investido,
            suitability:              usuario.suitability,
            suitability_complementar: usuario.suitability_complementar,
            saldo:                    usuario.saldo,
            liga:                     usuario.liga
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
                    porcentagem_empresas:        carteira.porcentagem_empresas,
                    porcentagem_emblemas:        carteira.porcentagem_emblemas,
                    porcentagem_pin_conservador: carteira.porcentagem_pin_conservador,
                    porcentagem_pin_moderado:    carteira.porcentagem_pin_moderado,
                    porcentagem_pin_agressivo:   carteira.porcentagem_pin_agressivo
                };
            }

            const defaultCarteira = {
                porcentagem_empresas:        50,
                porcentagem_emblemas:        50,
                porcentagem_pin_conservador: 50,
                porcentagem_pin_moderado:    30,
                porcentagem_pin_agressivo:   20
            };

            logger.warn(`Nenhuma carteira encontrada para o usuário ${usuarioOrganizado.usuario_id}`);
            logger.warn(`Utilizando carteira padrão: ${defaultCarteira.porcentagem_empresas}% Empresas, ${defaultCarteira.porcentagem_emblemas}% Emblemas`);

            return { ...usuarioOrganizado, ...defaultCarteira };
        };

        const usuarioComPorcentagens = definirPorcentagens();

        // Etapa 4: Buscar tokens e risco para o usuário
        const tokens = await UsersTokensModel.tokensUsuario(usuarioComPorcentagens.usuario_id);

        const usuarioComTokens = {
            ...usuarioComPorcentagens,
            quantidade_tokens: tokens.length > 0 ? tokens[0].quantidade_tokens : 0,
            risco:             tokens.length > 0 ? tokens[0].risco : null
        };

        // Etapa 5: Calcular distribuição percentual dos tokens por risco e perfil
        const calcularDistribuicao = () => {
            const riscos = {};
            const perfis = {};

            if (tokens.length === 0) {
                logger.warn(`Usuário ${usuarioComTokens.usuario_id} não possui tokens`);
                return { ...usuarioComTokens, distribuicao: {}, distribuicao_perfil: {} };
            }

            const totalTokens = tokens.reduce((acc, token) => acc + token.quantidade_tokens, 0);

            tokens.reduce((acc, token) => {
                acc[token.risco] = (token.quantidade_tokens / totalTokens) * 100;
                return acc;
            }, riscos);

            const totalCalculado = Object.values(riscos).reduce((acc, v) => acc + v, 0);
            if (Math.round(totalCalculado) !== 100) {
                const ajuste = 100 - totalCalculado;
                const maiorRisco = Object.keys(riscos).reduce((a, b) => riscos[a] > riscos[b] ? a : b);
                riscos[maiorRisco] += ajuste;
            }

            Object.keys(riscos).reduce((acc, risco) => {
                const perfil = ratings.find(r => r.rating === risco)?.perfil || 'Não Classificado';
                acc[perfil] = (acc[perfil] || 0) + riscos[risco];
                return acc;
            }, perfis);

            Object.keys(perfis).forEach(p => { perfis[p] = Number(perfis[p].toFixed(2)); });

            logger.info(`Distribuição de tokens para o usuário ${usuarioComTokens.usuario_id}:`);
            logger.info(JSON.stringify({ distribuicao: riscos, distribuicao_perfil: perfis }, null, 2));

            return { ...usuarioComTokens, distribuicao: riscos, distribuicao_perfil: perfis };
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

        const riscosAcesso = ligaUsuario.acessoInvestimentos;
        const tokensDisponiveis  = await BuscarPinsDisponiveisModel.getPins(riscosAcesso);
        const tokensEmbAtivos    = await BuscarTokensEmbAtivosModel.getTokensEmb();

        // Etapa 7: Equilibrar a carteira com base nas porcentagens desejadas
        const equilibrarCarteira = async () => {
            let saldo = usuarioComDistribuicao.saldo || 0;

            if (saldo <= 0) {
                logger.warn('-------------------------');
                logger.warn(`Usuário ${usuarioComDistribuicao.usuario_id} - Saldo insuficiente para realizar compras`);
                return {
                    ...usuarioComDistribuicao,
                    ajustes: [{ acao: 'Análise', descricao: 'Saldo insuficiente', recomendacao: 'Necessário recarregar o saldo para realizar compras' }]
                };
            }

            const saldoParaEmpresas = saldo * (usuarioComDistribuicao.porcentagem_empresas / 100);
            const saldoParaEmblemas = saldo * (usuarioComDistribuicao.porcentagem_emblemas / 100);

            logger.info(`Usuário ${usuarioComDistribuicao.usuario_id} - Split de saldo:`);
            logger.info(`  Empresas (${usuarioComDistribuicao.porcentagem_empresas}%): R$ ${saldoParaEmpresas.toFixed(8)}`);
            logger.info(`  Emblemas (${usuarioComDistribuicao.porcentagem_emblemas}%): R$ ${saldoParaEmblemas.toFixed(8)}`);

            const targetPerfil = {
                Conservador: usuarioComDistribuicao.porcentagem_pin_conservador,
                Moderado:    usuarioComDistribuicao.porcentagem_pin_moderado,
                Agressivo:   usuarioComDistribuicao.porcentagem_pin_agressivo
            };

            const comprarTokensPorPerfil = async (perfil, valorCompra) => {
                const isEMB = perfil === 'Emblema';

                const listaBase = isEMB
                    ? tokensEmbAtivos
                    : tokensDisponiveis.filter(token => {
                        const perfilToken = ratings.find(r => r.rating === token.risco)?.perfil || 'Não Classificado';
                        return perfilToken === perfil;
                    });

                if (listaBase.length === 0) return;

                const tokenPrice = 0.01;
                let orcamento = Math.floor(valorCompra / tokenPrice);
                if (orcamento <= 0) return;

                logger.info(`[${perfil}] Iniciando compra distribuída: ${orcamento} tokens entre ${listaBase.length} pin(s)`);

                const estoque = new Map(listaBase.map(t => [t.token_id, isEMB ? Infinity : t.quantidade_tokens]));

                while (orcamento > 0) {
                    const tokensAtivos = listaBase.filter(t => estoque.get(t.token_id) > 0);
                    if (tokensAtivos.length === 0) break;

                    const qtdBase = Math.floor(orcamento / tokensAtivos.length);
                    const extra   = orcamento % tokensAtivos.length;
                    let compradoNoLoop = 0;

                    for (let i = 0; i < tokensAtivos.length; i++) {
                        if (orcamento <= 0) break;
                        const token = tokensAtivos[i];

                        const alocado        = qtdBase + (i < extra ? 1 : 0);
                        const disponivelToken = estoque.get(token.token_id);
                        const qtd            = Math.min(alocado, disponivelToken, orcamento);
                        if (qtd <= 0) continue;

                        const releaseMutex = await mutex.acquire();
                        try {
                            await sleep(1000);

                            const tokensUsuario  = await UsersTokensModel.tokensUsuario(usuarioComDistribuicao.usuario_id);
                            const tokenAtual     = tokensUsuario.find(t => t.token_id === token.token_id);
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
                                if (!isEMB) {
                                    const tokensIPO    = await BuscarPinsDisponiveisModel.getPins(riscosAcesso);
                                    const tokenAtualIPO = tokensIPO.find(t => t.token_id === token.token_id);
                                    const qtdIPO       = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
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
                            orcamento        -= qtd;
                            compradoNoLoop   += qtd;
                        } catch (error) {
                            logger.error(`Erro ao comprar o token ${token.token_id}: ${error.message}`);
                        } finally {
                            releaseMutex();
                        }
                    }

                    if (compradoNoLoop === 0) break;
                }
            };

            const valorParaConservador = saldoParaEmpresas * (targetPerfil.Conservador / 100);
            const valorParaModerado    = saldoParaEmpresas * (targetPerfil.Moderado / 100);
            const valorParaAgressivo   = saldoParaEmpresas * (targetPerfil.Agressivo / 100);

            await comprarTokensPorPerfil('Conservador', valorParaConservador);
            await comprarTokensPorPerfil('Moderado',    valorParaModerado);
            await comprarTokensPorPerfil('Agressivo',   valorParaAgressivo);
            await comprarTokensPorPerfil('Emblema',     saldoParaEmblemas);

            // Gastar residual (round-robin por tokens de empresa)
            let saldoRestante = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
            saldo = parseFloat(saldoRestante.saldo);

            let indiceResidual = 0;
            while (saldo >= 0.01) {
                const tokensDisponiveisAtualizados = await BuscarPinsDisponiveisModel.getPins(riscosAcesso);
                const tokensEmpresaResidual = tokensDisponiveisAtualizados.filter(t => t.risco !== 'EMB');
                if (tokensEmpresaResidual.length === 0) break;

                indiceResidual = indiceResidual % tokensEmpresaResidual.length;
                const tokenResidual = tokensEmpresaResidual[indiceResidual];
                indiceResidual++;

                const tokenPrice = 0.01;
                const quantidadeParaComprar = Math.floor(saldo / tokenPrice);
                const quantidadeCompravel   = Math.min(quantidadeParaComprar, tokenResidual.quantidade_tokens);

                if (quantidadeCompravel > 0) {
                    const releaseMutex = await mutex.acquire();
                    try {
                        await sleep(1000);

                        const tokensUsuario   = await UsersTokensModel.tokensUsuario(usuarioComDistribuicao.usuario_id);
                        const tokenAtual      = tokensUsuario.find(t => t.token_id === tokenResidual.token_id);
                        const quantidadeAtual = tokenAtual ? tokenAtual.quantidade_tokens : 0;
                        const quantidadeTotal = quantidadeAtual + quantidadeCompravel;

                        const tokensIPO         = await BuscarPinsDisponiveisModel.getPins(riscosAcesso);
                        const tokenAtualIPO     = tokensIPO.find(t => t.token_id === tokenResidual.token_id);
                        const quantidadeTokensIPO = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
                        const quantidadeIPO     = quantidadeTokensIPO - quantidadeCompravel;

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
                    if (tokensEmpresaResidual.every(t => t.quantidade_tokens === 0)) break;
                }

                saldoRestante = await UsersSaldosModel.getSaldos(usuarioComDistribuicao.usuario_id);
                saldo = parseFloat(saldoRestante.saldo);
            }

            return { ...usuarioComDistribuicao, ajustes: [] };
        };

        const usuarioComAjustes = await equilibrarCarteira();

        logger.info('-------------------------');
        logger.info(`Finalizado processamento do usuário ${usuarioComAjustes.usuario_id}`);
        logger.info('Ajustes realizados:');
        logger.info(JSON.stringify(usuarioComAjustes.ajustes, null, 2));

        return usuarioComAjustes;
    } catch (error) {
        logger.error(`Erro ao processar o usuário ${usuario.usuario_id}: ${error.message}`);
        return { ...usuario, error: 'Erro ao processar o usuário', message: 'Ocorreu um erro durante o processamento.' };
    }
}

module.exports = { processarUsuario };
