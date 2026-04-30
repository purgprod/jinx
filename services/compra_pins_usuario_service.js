// services/compra_pins_usuario_service.js
// Executa a compra de pins para um único usuário.
// Usado tanto pela rotina diária (controller_poppy_compra_diaria_pins.js)
// quanto pelo webhook de depósito (controller_webhook_pix_efi) para
// garantir que o saldo nunca fique parado após um depósito confirmado.
//
// Perfil de compra fixo para todos os usuários:
//   50% do saldo → Pins de Emblema (EMB)
//   50% do saldo → distribuído igualitariamente entre todos os outros Pins disponíveis

'use strict';

const Mutex = require('async-mutex').Mutex;
const logger = require('../logger');
const { withTransaction } = require('../database/transaction');
const UsersTokensModel = require('../models/usuarios/model_tokens_usuarios');
const BuscarPinsDisponiveisModel = require('../models/rotinas/model_poppy_buscar_pins_disponiveis');
const BuscarTokensEmbAtivosModel = require('../models/rotinas/model_poppy_buscar_tokens_emb_ativos');
const AtualizarQuantidadeTokensModel = require('../models/rotinas/model_poppy_comprar_pins_disponiveis');
const UsersSaldosModel = require('../models/usuarios/model_saldos_usuarios');
const AtualizarSaldoUsuariosModel = require('../models/rotinas/model_poppy_atualizar_saldo_usuarios');
const ligaAcessoInvestimentos = require('../public/js/usuarios/acesso_investimentos_por_liga');
const BuscarSaquePendenteModel = require('../models/endpoints/model_saque_buscar_saque_pendente');
const ligas = ligaAcessoInvestimentos.default;

// Mutex compartilhado entre a rotina diária e os webhooks — evita compras concorrentes
const mutex = new Mutex();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processa a compra de pins para um único usuário.
 *
 * @param {Object} usuario - Dados do usuário conforme retornados pela tabela carteiras JOIN users
 *   Campos obrigatórios: usuario_id, saldo, investido, liga
 */
async function processarUsuario(usuario) {
    try {
        // Bloqueia compra automática enquanto há saque aguardando confirmação do banco.
        const saquePendente = await BuscarSaquePendenteModel.getSaquePendente(usuario.usuario_id);
        if (saquePendente && saquePendente.length > 0) {
            logger.info(`[CompraPin] Usuário ${usuario.usuario_id} possui saque em Processando. Compra automática ignorada.`);
            return;
        }

        const usuarioOrganizado = {
            usuario_id: usuario.usuario_id,
            investido:  usuario.investido,
            saldo:      usuario.saldo,
            liga:       usuario.liga
        };

        logger.info('-------------------------');
        logger.info('Dados do usuário organizado:');
        logger.info(JSON.stringify(usuarioOrganizado, null, 2));

        // Buscar tokens disponíveis com base na liga do usuário
        const ligaUsuario = ligas.find(r => r.nomeLiga === usuarioOrganizado.liga);
        if (!ligaUsuario) {
            logger.warn(`Liga não encontrada para o usuário ${usuarioOrganizado.usuario_id}`);
            return usuarioOrganizado;
        }

        logger.info(
            `Liga do usuário ${usuarioOrganizado.usuario_id}: ${ligaUsuario.nomeLiga} | AcessoInvestimentos: ${ligaUsuario.acessoInvestimentos.join(', ')}`
        );

        const riscosAcesso = ligaUsuario.acessoInvestimentos;
        const tokensDisponiveis = await BuscarPinsDisponiveisModel.getPins(riscosAcesso);
        const tokensEmbAtivos   = await BuscarTokensEmbAtivosModel.getTokensEmb();

        // Comprar pins: 50% Emblemas, 50% distribuído igualitariamente entre todos os outros pins
        const equilibrarCarteira = async () => {
            let saldo = usuarioOrganizado.saldo || 0;

            if (saldo <= 0) {
                logger.warn(`Usuário ${usuarioOrganizado.usuario_id} - Saldo insuficiente para realizar compras`);
                return {
                    ...usuarioOrganizado,
                    ajustes: [{ acao: 'Análise', descricao: 'Saldo insuficiente', recomendacao: 'Necessário recarregar o saldo para realizar compras' }]
                };
            }

            const semPinsEmpresa    = tokensDisponiveis.length === 0;
            const saldoParaEmpresas = semPinsEmpresa ? 0 : saldo * 0.50;
            const saldoParaEmblemas = saldo - saldoParaEmpresas;

            if (semPinsEmpresa) {
                logger.warn(`Usuário ${usuarioOrganizado.usuario_id} - Nenhum Pin de empresa disponível no IPO. Comprando 100% em Emblemas.`);
            }
            logger.info(`Usuário ${usuarioOrganizado.usuario_id} - Split de saldo:`);
            logger.info(`  Empresas (${semPinsEmpresa ? '0' : '50'}%): R$ ${saldoParaEmpresas.toFixed(8)}`);
            logger.info(`  Emblemas (${semPinsEmpresa ? '100' : '50'}%): R$ ${saldoParaEmblemas.toFixed(8)}`);

            // Compra distribuída igualitariamente entre os pins de uma lista.
            // isEMB = true → estoque ilimitado (a Purg não possui EMB no IPO)
            const comprarPins = async (listaBase, valorCompra, isEMB = false) => {
                if (listaBase.length === 0) return;

                const tokenPrice = 0.01;
                let orcamento = Math.floor(valorCompra / tokenPrice);
                if (orcamento <= 0) return;

                logger.info(`[${isEMB ? 'Emblema' : 'Empresas'}] Iniciando compra distribuída: ${orcamento} tokens entre ${listaBase.length} pin(s)`);

                // Mapa de estoque local por token_id (Infinity para EMB — sem limite)
                const estoque = new Map(listaBase.map(t => [t.token_id, isEMB ? Infinity : t.quantidade_tokens]));

                // Distribui em rodadas: cada rodada divide o orçamento restante
                // igualmente entre os tokens que ainda têm estoque.
                while (orcamento > 0) {
                    const tokensAtivos = listaBase.filter(t => estoque.get(t.token_id) > 0);
                    if (tokensAtivos.length === 0) break;

                    const qtdBase = Math.floor(orcamento / tokensAtivos.length);
                    const extra   = orcamento % tokensAtivos.length;
                    let compradoNoLoop = 0;

                    for (let i = 0; i < tokensAtivos.length; i++) {
                        if (orcamento <= 0) break;
                        const token = tokensAtivos[i];

                        const alocado         = qtdBase + (i < extra ? 1 : 0);
                        const disponivelToken  = estoque.get(token.token_id);
                        const qtd             = Math.min(alocado, disponivelToken, orcamento);
                        if (qtd <= 0) continue;

                        const releaseMutex = await mutex.acquire();
                        try {
                            await sleep(1000);

                            const tokensUsuario   = await UsersTokensModel.tokensUsuario(usuarioOrganizado.usuario_id);
                            const tokenAtual      = tokensUsuario.find(t => t.token_id === token.token_id);
                            const quantidadeAtual = tokenAtual ? tokenAtual.quantidade_tokens : 0;
                            const quantidadeTotal = quantidadeAtual + qtd;

                            const saldo_usuario = await UsersSaldosModel.getSaldos(usuarioOrganizado.usuario_id);
                            saldo = parseFloat(saldo_usuario.saldo) - (qtd * tokenPrice);

                            await withTransaction(async (conn) => {
                                await AtualizarQuantidadeTokensModel.atualizarQuantidadeTokens(
                                    usuarioOrganizado.usuario_id, token.token_id, quantidadeTotal, conn
                                );
                                await AtualizarQuantidadeTokensModel.gravarTransacao(
                                    usuarioOrganizado.usuario_id, token.token_id, qtd, conn
                                );
                                if (!isEMB) {
                                    const tokensIPO     = await BuscarPinsDisponiveisModel.getPins(riscosAcesso);
                                    const tokenAtualIPO = tokensIPO.find(t => t.token_id === token.token_id);
                                    const qtdIPO        = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
                                    await AtualizarQuantidadeTokensModel.atualizarTokensIPO(
                                        token.token_id, qtdIPO - qtd, conn
                                    );
                                }
                                await AtualizarSaldoUsuariosModel.atualizarSaldo(
                                    saldo, usuarioOrganizado.usuario_id, conn
                                );
                            });

                            logger.info(`Compra executada: Token ID ${token.token_id} (${isEMB ? 'Emblema' : 'Empresas'}), qtd: ${qtd}`);
                            estoque.set(token.token_id, disponivelToken - qtd);
                            orcamento      -= qtd;
                            compradoNoLoop += qtd;
                        } catch (error) {
                            logger.error(`Erro ao comprar o token ${token.token_id}: ${error.message}`);
                        } finally {
                            releaseMutex();
                        }
                    }

                    if (compradoNoLoop === 0) break;
                }
            };

            await comprarPins(tokensDisponiveis, saldoParaEmpresas, false);
            await comprarPins(tokensEmbAtivos,   saldoParaEmblemas,  true);

            // Residual: gasta qualquer centavo restante em round-robin sobre tokens de empresa
            let saldoRestante = await UsersSaldosModel.getSaldos(usuarioOrganizado.usuario_id);
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

                        const tokensUsuario     = await UsersTokensModel.tokensUsuario(usuarioOrganizado.usuario_id);
                        const tokenAtual        = tokensUsuario.find(t => t.token_id === tokenResidual.token_id);
                        const quantidadeAtual   = tokenAtual ? tokenAtual.quantidade_tokens : 0;
                        const quantidadeTotal   = quantidadeAtual + quantidadeCompravel;

                        const tokensIPO           = await BuscarPinsDisponiveisModel.getPins(riscosAcesso);
                        const tokenAtualIPO       = tokensIPO.find(t => t.token_id === tokenResidual.token_id);
                        const quantidadeTokensIPO = tokenAtualIPO ? tokenAtualIPO.quantidade_tokens : 0;
                        const quantidadeIPO       = quantidadeTokensIPO - quantidadeCompravel;

                        saldo -= (quantidadeCompravel * tokenPrice);

                        await withTransaction(async (conn) => {
                            await AtualizarQuantidadeTokensModel.atualizarQuantidadeTokens(
                                usuarioOrganizado.usuario_id, tokenResidual.token_id, quantidadeTotal, conn
                            );
                            await AtualizarQuantidadeTokensModel.gravarTransacao(
                                usuarioOrganizado.usuario_id, tokenResidual.token_id, quantidadeCompravel, conn
                            );
                            await AtualizarQuantidadeTokensModel.atualizarTokensIPO(
                                tokenResidual.token_id, quantidadeIPO, conn
                            );
                            await AtualizarSaldoUsuariosModel.atualizarSaldo(
                                saldo, usuarioOrganizado.usuario_id, conn
                            );
                        });

                        logger.info(`Compra residual: Token ID ${tokenResidual.token_id}, qtd: ${quantidadeCompravel}`);
                    } finally {
                        releaseMutex();
                    }
                } else {
                    if (tokensEmpresaResidual.every(t => t.quantidade_tokens === 0)) break;
                }

                saldoRestante = await UsersSaldosModel.getSaldos(usuarioOrganizado.usuario_id);
                saldo = parseFloat(saldoRestante.saldo);
            }

            return { ...usuarioOrganizado, ajustes: [] };
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
