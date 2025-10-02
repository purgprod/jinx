// controllers/rotinas/controller_poppy_recompra_pins_sinistro.js
const logger = require('../../logger');
const BuscarPinsSinistroModel = require('../../models/rotinas/model_poppy_buscar_pins_sinistro');
const BuscarUsuariosQuantidadeRendimentoPinsModel = require('../../models/rotinas/model_poppy_buscar_usuarios_quantidade_rendimento_pins');
const AtualizarPinsModel = require('../../models/rotinas/model_poppy_atualizar_pins_para_clientes');
const TransacoesPinsModel = require('../../models/rotinas/model_poppy_transacoes_pins_para_purg');
const BuscarSaldosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_saldos_carteiras_por_usuario');
const AtualizarCarteiraUsuarioModel = require('../../models/rotinas/model_poppy_atualizar_carteiras');
const BuscarUsuariosAssinaturasModel = require('../../models/rotinas/model_manutencao_buscar_usuarios_assinaturas');
const BuscarQuantidadeRendimentoPinsPurgModel = require('../../models/rotinas/model_poppy_buscar_quantidade_rendimento_pins_purg');
const BuscarRatingsPinsSinistroModel = require('../../models/rotinas/model_poppy_buscar_ratings_pins_sinistro');
const BuscarSinistroCarteirasModel = require('../../models/rotinas/model_poppy_buscar_sinistro_carteiras');

const RecompraPinsSinistroController = {
    async executeRecompraPinsSinistro(req, res) {
        logger.info('Iniciando recompra‑pins‑sinistro');

        // Etapa Geral: Coletar sinistros dos usuários
        let sinistroPorUsuario = {};
        try {
            logger.info('Etapa 2: Coletando sinistros dos usuários');
            const sinistroCarteiras = await BuscarSinistroCarteirasModel.getSinistroCarteiras();

            if (!sinistroCarteiras.length) {
                logger.warn('Nenhum sinistro encontrado para usuários');
            } else {
                sinistroCarteiras.forEach(({ usuario_id, sinistro }) => {
                    sinistroPorUsuario[usuario_id] = parseFloat(sinistro);
                });
                logger.info(`Sinistros coletados para usuários: ${JSON.stringify(sinistroPorUsuario)}`);
            }
        } catch (error) {
            logger.error('Erro ao buscar sinistros das carteiras:', error);
            return res.status(500).json({
                error: 'Erro ao buscar sinistros das carteiras',
                message: 'Ocorreu um erro ao tentar buscar os sinistros das carteiras',
            });
        }

        // Etapa 1: Buscar tokens em sinistro
        try {
            logger.info('Etapa 1: Buscando tokens em sinistro');
            const pinsSinistro = await BuscarPinsSinistroModel.getPinsSinistro();

            if (!pinsSinistro.length) {
                logger.warn('Nenhum Pin em sinistro encontrado na Etapa 1');
                logger.info('Processo concluído sem tokens para processar');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    tokens: [],
                });
            }

            // Etapa 1.1: Loop por token
            for (const pin of pinsSinistro) {
                const token_id = pin.id_token;
                logger.info(`Processando token: ${token_id}`);

                // Etapa 1.1.1: Buscar risco do token
                let rating;
                try {
                    const [ratingData] = await BuscarRatingsPinsSinistroModel.getRatingsPinsSinistro(token_id);

                    if (!ratingData) {
                        logger.warn(`Nenhum rating encontrado para o token ${token_id}`);
                        continue;
                    }

                    rating = ratingData.risco;
                    logger.info(`Risco encontrado para o token ${token_id}: ${rating}`);

                } catch (error) {
                    logger.error(`Erro ao buscar risco para o token ${token_id}:`, error);
                    return res.status(500).json({
                        error: `Erro ao buscar risco para o token ${token_id}`,
                        message: 'Ocorreu um erro ao tentar buscar o risco do token',
                    });
                }

                // Etapa 1.1.2: Buscar dados do usuário IPO
                let quantidade_tokens_ipo = 0;
                let rendimento_token_ipo = 0;
                try {
                    const [usuarioIpoData] = await BuscarQuantidadeRendimentoPinsPurgModel.getQuantidadeRendimentoPinsPurg(token_id);

                    if (usuarioIpoData) {
                        quantidade_tokens_ipo = usuarioIpoData.quantidade_tokens;
                        rendimento_token_ipo = usuarioIpoData.rendimento_token;
                    }

                    logger.info(`Dados do IPO para token ${token_id} - Quantidade de Tokens: ${quantidade_tokens_ipo}, Rendimento: ${rendimento_token_ipo}`);

                } catch (error) {
                    logger.error(`Erro ao buscar dados do IPO para token ${token_id}:`, error);
                    return res.status(500).json({
                        error: `Erro ao buscar dados do IPO para token ${token_id}`,
                        message: 'Ocorreu um erro ao tentar buscar dados do usuário IPO',
                    });
                }

                // Etapa 1.1.3: Buscar usuários por token
                try {
                    const usuariosQuantidadeRendimento = await BuscarUsuariosQuantidadeRendimentoPinsModel.getUsuariosQuantidadeRendimentoPins(token_id);

                    if (!usuariosQuantidadeRendimento.length) {
                        logger.warn(`Nenhum usuário encontrado para o token ${token_id}`);
                        continue;
                    }

                    logger.info(`Usuários encontrados para o token ${token_id}: ${JSON.stringify(usuariosQuantidadeRendimento)}`);

                    // Etapa 1.1.3.1: Verificar assinatura do cliente
                    for (const usuario of usuariosQuantidadeRendimento) {
                        const usuario_id = usuario.usuario_id;
                        let quantidade_tokens_cliente = usuario.quantidade_tokens;
                        const rendimento_token = usuario.rendimento_token;

                        try {
                            const [plano] = await BuscarUsuariosAssinaturasModel.getPlanos(usuario_id);

                            if (!plano || plano.assinatura !== 'Poppy Pro') {
                                logger.warn(`Usuário ${usuario_id} não possui assinatura 'Poppy Pro'`);
                                continue;
                            }

                            logger.info(`Usuário ${usuario_id} verificado com assinatura 'Poppy Pro'`);
                        } catch (error) {
                            logger.error(`Erro ao verificar assinatura para o usuário ${usuario_id}:`, error);
                            return res.status(500).json({
                                error: `Erro ao verificar assinatura para o usuário ${usuario_id}`,
                                message: 'Ocorreu um erro ao tentar verificar a assinatura do usuário',
                            });
                        }

                        // Etapa 1.1.3.2: Processar cada usuário encontrado
                        logger.info(`Processando usuário: ${usuario_id}, Quantidade de Tokens: ${quantidade_tokens_cliente}, Rendimento: ${rendimento_token}`);

                        // Etapa 1.1.3.3: Verificar porcentagem de sinistro do usuário
                        let porcentagemCompra = 0;
                        const riscosPermitidos = ['AA', 'AR1', 'AR2', 'A1', 'A2', 'A3', 'BBR1', 'BBR2', 'BB'];

                        if (riscosPermitidos.includes(rating)) {
                            porcentagemCompra = 1;
                        } else {
                            porcentagemCompra = (sinistroPorUsuario[usuario_id] || 0) / 100;
                        }

                        logger.info(`Porcentagem de compra para usuário ${usuario_id}: ${porcentagemCompra}`);

                        // Etapa 1.1.3.4: Calcular a quantidade de tokens a ser comprada
                        const calculo_token_cliente = Math.round(usuario.quantidade_tokens * porcentagemCompra);
                        quantidade_tokens_cliente -= calculo_token_cliente;
                        quantidade_tokens_ipo += calculo_token_cliente;

                        logger.info(`Quantidade de tokens a ser comprada para usuário ${usuario_id}: ${quantidade_tokens_cliente}`);
                        logger.info(`Nova quantidade de tokens IPO para token ${token_id}: ${quantidade_tokens_ipo}`);

                        // Etapa 1.1.3.5: Atualizar a quantidade de tokens do usuário
                        try {
                            await AtualizarPinsModel.atualizarPins(token_id, usuario_id, quantidade_tokens_cliente);
                            logger.info(`Quantidade de tokens atualizada para usuário ${usuario_id} e token ${token_id}`);
                        } catch (error) {
                            logger.error(`Erro ao atualizar quantidade de tokens para o usuário ${usuario_id} e token ${token_id}:`, error);
                            return res.status(500).json({
                                error: `Erro ao atualizar quantidade de tokens para o usuário ${usuario_id} e token ${token_id}`,
                                message: 'Ocorreu um erro ao tentar atualizar a quantidade de tokens',
                            });
                        }

                        // Etapa 1.1.3.6: Atualizar a quantidade de tokens do IPO
                        try {
                            await AtualizarPinsModel.atualizarPins(token_id, 1, quantidade_tokens_ipo);
                            logger.info(`Quantidade de tokens IPO atualizada para token ${token_id}`);
                        } catch (error) {
                            logger.error(`Erro ao atualizar quantidade de tokens do IPO para token ${token_id}:`, error);
                            return res.status(500).json({
                                error: `Erro ao atualizar quantidade de tokens do IPO para token ${token_id}`,
                                message: 'Ocorreu um erro ao tentar atualizar a quantidade de tokens do IPO',
                            });
                        }

                        // Etapa 1.1.3.7: Gravar as transações de venda
                        const tokens_transacao_cliente = calculo_token_cliente * 0.01;
                        try {
                            await TransacoesPinsModel.transacoesPins(usuario_id, token_id, calculo_token_cliente, tokens_transacao_cliente);
                            logger.info(`Transação registrada para usuário ${usuario_id} e token ${token_id}`);
                        } catch (error) {
                            logger.error(`Erro ao registrar transação para o usuário ${usuario_id} e token ${token_id}:`, error);
                            return res.status(500).json({
                                error: `Erro ao registrar transação para o usuário ${usuario_id} e token ${token_id}`,
                                message: 'Ocorreu um erro ao tentar registrar a transação',
                            });
                        }

                        // Etapa 1.1.3.8: Atualizar o saldo dos usuários e IPO
                        try {
                            // Obter saldo do usuário
                            const saldoDadosCliente = await BuscarSaldosCarteirasModel.getSaldosCarteiras(usuario_id);
                            const saldo_atual_cliente = saldoDadosCliente.length > 0 ? parseFloat(saldoDadosCliente[0].saldo) : 0;
                            logger.info(`Saldo atual do usuário ${usuario_id} é ${saldo_atual_cliente}`);

                            // Calcular novo saldo do cliente (operação de soma)
                            const saldo_novo_cliente = saldo_atual_cliente + tokens_transacao_cliente;
                            logger.info(`Novo saldo do usuário ${usuario_id} após transação é ${saldo_novo_cliente}`);

                            // Obter saldo do IPO
                            const saldoDadosIpo = await BuscarSaldosCarteirasModel.getSaldosCarteiras(1);
                            const saldo_atual_ipo = saldoDadosIpo.length > 0 ? parseFloat(saldoDadosIpo[0].saldo) : 0;
                            logger.info(`Saldo atual do IPO é ${saldo_atual_ipo}`);

                            // Calcular novo saldo do IPO (operação de subtração)
                            const saldo_novo_ipo = saldo_atual_ipo - tokens_transacao_cliente;
                            logger.info(`Novo saldo do IPO após transação é ${saldo_novo_ipo}`);

                            // Atualizar saldos no banco de dados
                            try {
                                // Atualizar saldo do usuário
                                await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(usuario_id, saldo_novo_cliente);
                                logger.info(`Saldo do usuário ${usuario_id} atualizado para ${saldo_novo_cliente}`);

                                // Atualizar saldo do IPO
                                await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(1, saldo_novo_ipo);
                                logger.info(`Saldo do IPO atualizado para ${saldo_novo_ipo}`);

                            } catch (error) {
                                logger.error(`Erro ao atualizar saldos:`, error);
                                return res.status(500).json({
                                    error: `Erro ao atualizar saldos`,
                                    message: 'Ocorreu um erro ao tentar atualizar os saldos',
                                });
                            }

                        } catch (error) {
                            logger.error(`Erro ao buscar saldo:`, error);
                            return res.status(500).json({
                                error: `Erro ao buscar saldo`,
                                message: 'Ocorreu um erro ao tentar buscar o saldo',
                            });
                        }

                    }

                } catch (error) {
                    logger.error(`Erro ao buscar usuários para o token ${token_id}:`, error);
                    return res.status(500).json({
                        error: `Erro ao buscar usuários para o token ${token_id}`,
                        message: 'Ocorreu um erro ao tentar buscar os usuários do token',
                    });
                }
            }

            // Mensagem de sucesso após execução completa
            logger.info('Rotinas executadas com sucesso');
            return res.status(200).json({
                message: 'Rotinas executadas com sucesso'
            });

        } catch (error) {
            logger.error('Erro ao buscar tokens em sinistro:', error);
            return res.status(500).json({
                error: 'Erro ao buscar tokens em sinistro',
                message: 'Ocorreu um erro ao tentar buscar os tokens em sinistro',
            });
        }
    },
};

module.exports = RecompraPinsSinistroController;

