const logger = require('../../logger');
const BuscarPinsModel = require('../../models/rotinas/model_poppy_buscar_pins_vencidos');
const BuscarUsuariosQuantidadeRendimentoPinsModel = require('../../models/rotinas/model_poppy_buscar_usuarios_quantidade_rendimento_pins');
const ZerarPinsModel = require('../../models/rotinas/model_poppy_zerar_pins_para_clientes');
const MoverPinsModel = require('../../models/rotinas/model_poppy_mover_pins_para_purg');
const TransacoesPinsModel = require('../../models/rotinas/model_poppy_transacoes_pins_para_purg');
const BuscarSaldosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_saldos_carteiras');
const AtualizarCarteiraUsuarioModel = require('../../models/rotinas/model_poppy_atualizar_carteiras');

const MAX_USUARIOS_LOG = process.env.MAX_USUARIOS_LOG || 100;

const RecompraPinsVencidosController = {
    async executeRecompraPinsVencidos(req, res) {
        logger.info('Iniciando recompra de Pins vencidos');

        try {
            // Etapa 1: Buscar Pins vencidos
            const pinsAtivos = await BuscarPinsModel.getPins();

            if (!pinsAtivos.length) {
                logger.warn('Nenhum Pin ativo encontrado');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    pinsAtivos: [],
                    usuariosPorToken: {},
                });
            }

            // Etapa 2: Buscar usuários por token
            const idTokens = [];
            for (const pin of pinsAtivos) {
                const tokenId = parseInt(pin.id_token, 10);
                if (!isNaN(tokenId)) {
                    idTokens.push(tokenId);
                }
            }

            if (idTokens.length === 0) {
                logger.warn('Nenhum Pin válido encontrado');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    pins: pinsAtivos,
                    usuariosPorToken: {},
                });
            }

            const usuariosPorToken = {};
            for (const tokenId of idTokens) {
                try {
                    const usuarios = await BuscarUsuariosQuantidadeRendimentoPinsModel.getUsuariosQuantidadeRendimentoPins(tokenId);
                    if (usuarios.length === 0) {
                        logger.warn(`Nenhum usuário encontrado para o token ${tokenId}`);
                        usuariosPorToken[tokenId] = [];
                        continue;
                    }
                    usuariosPorToken[tokenId] = usuarios;
                } catch (error) {
                    logger.error(`Erro ao buscar usuários para o token ${tokenId}:`, error);
                    usuariosPorToken[tokenId] = [];
                }
            }

            if (Object.keys(usuariosPorToken).length === 0) {
                logger.warn('Nenhum usuário encontrado para os tokens');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    pinsAtivos: pinsAtivos,
                    usuariosPorToken: {},
                });
            }

            // Etapa 3: Calcular totais por token
            const tokensTotais = {};
            let hasValidData = true;

            for (const tokenId in usuariosPorToken) {
                const usuarios = usuariosPorToken[tokenId];
                let totalQuantidade = 0;
                let totalRendimento = 0;

                if (usuarios.length === 0) {
                    logger.warn(`Nenhum usuário encontrado para o token ${tokenId}`);
                    continue;
                }

                for (const usuario of usuarios) {
                    // Ensure that quantidade_tokens is a valid number
                    const quantidade = typeof usuario.quantidade_tokens === 'number' ?
                        usuario.quantidade_tokens : parseFloat(usuario.quantidade_tokens);
                    
                    if (isNaN(quantidade)) {
                        logger.warn(`Quantidade inválida para o usuário ${usuario.usuario_id}`);
                        continue;
                    }
                    totalQuantidade += quantidade;

                    // Ensure that rendimento_token is a valid number
                    const rendimento = typeof usuario.rendimento_token === 'number' ?
                        usuario.rendimento_token : parseFloat(usuario.rendimento_token);
                    
                    if (isNaN(rendimento)) {
                        logger.warn(`Rendimento inválido para o usuário ${usuario.usuario_id}`);
                        continue;
                    }
                    totalRendimento += rendimento;
                }

                tokensTotais[tokenId] = {
                    totalQuantidade,
                    totalRendimento
                };

                logger.info(`Totais para o Token ${tokenId}: ${totalQuantidade} (Quantidade) e ${totalRendimento} (Rendimento)`);
            }

            if (Object.keys(tokensTotais).length === 0) {
                logger.warn('Nenhum total válido encontrado');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    pinsAtivos: pinsAtivos,
                    usuariosPorToken: {},
                    tokensTotais: {},
                });
            }

            // Etapa 4: Registrar transações
            logger.info('Iniciando registro das transações');

            const transacoesRealizadas = []; // Armazenará as transações individuais

            for (const tokenId in tokensTotais) {
                const { totalQuantidade, totalRendimento } = tokensTotais[tokenId];
                const totalTransacao = totalQuantidade / 100; // Valor total da transação

                // Verifica se existem usuários para processar
                if (usuariosPorToken[tokenId].length === 0) {
                    logger.warn(`Nenhum usuário encontrado para o token ${tokenId}`);
                    continue;
                }

                for (const usuario of usuariosPorToken[tokenId]) {
                    // Ignora o usuário com id 1
                    if (usuario.usuario_id === 1) {
                        logger.info(`Pulando usuário 1`);
                        continue;
                    }

                    try {
                        logger.info(`Iniciando registro da transação para o usuário ${usuario.usuario_id}`);
                        
                        // Define a quantidade_token como a quantidade do usuário
                        const quantidadeToken = typeof usuario.quantidade_tokens === 'number' ? 
                            usuario.quantidade_tokens : parseFloat(usuario.quantidade_tokens);
                        
                        // Verifica se a quantidade_token é um número válido
                        if (isNaN(quantidadeToken)) {
                            logger.warn(`Quantidade inválida para o usuário ${usuario.usuario_id}`);
                            continue;
                        }

                        // Calcula o valor da transação com base na quantidade do usuário
                        const valorTransacaoIndividual = quantidadeToken / 100;

                        // Verifica se o valor da transação é um número válido
                        if (isNaN(valorTransacaoIndividual)) {
                            logger.warn(`Valor de transação inválido para o usuário ${usuario.usuario_id}`);
                            continue;
                        }

                        const resultado = await TransacoesPinsModel.transacoesPins(
                            usuario.usuario_id, // usuario_id
                            tokenId, // id_token
                            quantidadeToken, // quantidade_token individual
                            valorTransacaoIndividual // valor_transacao individual
                        );

                        // Armazena a transação realizada
                        transacoesRealizadas.push({
                            usuario_id: usuario.usuario_id,
                            valorTransacaoIndividual: valorTransacaoIndividual
                        });

                        logger.info(`Transação registrada com sucesso para o usuário ${usuario.usuario_id}`);
                        logger.info(`Resultado da transação: ${JSON.stringify(resultado)}`);
                    } catch (error) {
                        logger.error(`Erro ao registrar transação para o usuário ${usuario.usuario_id}:`, error);
                        logger.error(`Mensagem do erro: ${error.message}`);
                        return res.status(500).json({
                            error: 'Erro ao registrar transação',
                            message: `Erro ao processar o usuário ${usuario.usuario_id}: ${error.message}`,
                            tokensTotais: tokensTotais,
                        });
                    }
                }
            }

            // Etapa 5: Movimentação dos tokens para Purg
            for (const tokenId in tokensTotais) {
                const { totalQuantidade, totalRendimento } = tokensTotais[tokenId];
                
                try {
                    const resultado = await MoverPinsModel.moverPins(tokenId, totalQuantidade, totalRendimento);
                    logger.info(`Movimentação concluída com sucesso para o Token ${tokenId}`);
                    logger.info(`Resultado da movimentação: ${JSON.stringify(resultado)}`);
                } catch (error) {
                    logger.error(`Erro ao movimentar tokens para o Token ${tokenId}:`, error);
                    logger.error(`Mensagem do erro: ${error.message}`);
                    return res.status(500).json({
                        error: 'Erro ao movimentar tokens',
                        message: `Erro ao processar o Token ${tokenId}: ${error.message}`,
                        tokensTotais: tokensTotais,
                    });
                }
            }

            // Etapa 6: Zerar os tokens para os usuários
            const usuariosAFazerZerar = [];
            for (const tokenId in usuariosPorToken) {
                usuariosAFazerZerar.push(...usuariosPorToken[tokenId]);
            }

            if (usuariosAFazerZerar.length === 0) {
                logger.warn('Nenhum usuário para zerar tokens');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    pinsAtivos: pinsAtivos,
                    usuariosPorToken: {},
                    tokensTotais: tokensTotais,
                });
            }

            for (const usuario of usuariosAFazerZerar) {
                try {
                    let token = usuario.token_id;
                    if (typeof token === 'string') {
                        token = parseInt(token, 10);
                    }
                    
                    if (typeof token !== 'number' || isNaN(token)) {
                        logger.warn(`Usuário com token inválido: ${JSON.stringify(usuario)}`);
                        continue;
                    }

                    const resultado = await ZerarPinsModel.zerarPins(token);
                    logger.info(`Tokens zerados com sucesso para o usuário ${usuario.usuario_id}`);
                    logger.info(`Resultado da atualização: ${JSON.stringify(resultado)}`);
                } catch (error) {
                    logger.error(`Erro ao zerar tokens para o usuário ${usuario.usuario_id}:`, error);
                    logger.error(`Mensagem do erro: ${error.message}`);
                    return res.status(500).json({
                        error: 'Erro ao zerar tokens',
                        message: `Erro ao processar o usuário ${usuario.usuario_id}: ${error.message}`,
                        pinsAtivos: pinsAtivos,
                        usuariosPorToken: {},
                        tokensTotais: tokensTotais,
                    });
                }
            }

            // Etapa 7: Atualizar o saldo da carteira
            logger.info('Iniciando atualização do saldo da carteira');

            // Buscar os saldos atuais das carteiras
            const saldos = await BuscarSaldosCarteirasModel.getSaldosCarteiras();

            // Verificar se há dados válidos
            if (!saldos.length) {
                logger.warn('Nenhum saldo encontrado nas carteiras');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    pinsAtivos: pinsAtivos,
                    usuariosPorToken: {},
                    tokensTotais: tokensTotais,
                });
            }

            // Atualizar o saldo para cada usuário com base nas transações realizadas
            for (const transacao of transacoesRealizadas) {
                const usuario_id = transacao.usuario_id;
                const valorTransacaoIndividual = transacao.valorTransacaoIndividual;

                try {
                    // Encontrar o saldo atual do usuário
                    const saldoAtual = saldos.find(saldo => saldo.usuario_id === usuario_id);
                    
                    if (!saldoAtual) {
                        logger.warn(`Nenhum saldo encontrado para o usuário ${usuario_id}`);
                        continue;
                    }

                    // Calcular o novo saldo
                    const novoSaldo = parseFloat(saldoAtual.saldo) + parseFloat(valorTransacaoIndividual);

                    // Atualizar o saldo da carteira
                    const resultado = await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(
                        usuario_id,
                        novoSaldo
                    );

                    logger.info(`Saldo da carteira atualizado com sucesso para o usuário ${usuario_id}`);
                    logger.info(`Novo saldo: ${novoSaldo.toFixed(8)}`);
                    logger.info(`Resultado da atualização: ${JSON.stringify(resultado)}`);
                } catch (error) {
                    logger.error(`Erro ao atualizar o saldo da carteira para o usuário ${usuario_id}:`, error);
                    logger.error(`Mensagem do erro: ${error.message}`);
                    return res.status(500).json({
                        error: 'Erro ao atualizar o saldo da carteira',
                        message: `Erro ao processar o usuário ${usuario_id}: ${error.message}`,
                        pinsAtivos: pinsAtivos,
                        usuariosPorToken: {},
                        tokensTotais: tokensTotais,
                    });
                }
            }

            // Resposta final
            logger.info('Rotina concluída com sucesso');
            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                pinsAtivos: pinsAtivos,
                usuariosPorToken: usuariosPorToken,
                tokensTotais: tokensTotais,
            });

        } catch (error) {
            logger.error('Erro inesperado:', error);
            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro inesperado durante a execução da rotina',
            });
        }
    },
};

module.exports = RecompraPinsVencidosController;

