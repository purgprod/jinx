const logger = require('../../logger');
const { withTransaction } = require('../../database/transaction');
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

            // Etapa 4: Buscar saldos atuais antes de iniciar as escritas
            logger.info('Buscando saldos atuais das carteiras');
            const saldos = await BuscarSaldosCarteirasModel.getSaldosCarteiras();
            if (!saldos.length) {
                logger.warn('Nenhum saldo encontrado nas carteiras');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    pinsAtivos: pinsAtivos,
                    usuariosPorToken: {},
                    tokensTotais: tokensTotais,
                });
            }

            // Etapas 4–6 (atômicas por usuário): gravar transações + zerar tokens + atualizar saldo.
            // Para cada usuário, todos os passos são revertidos juntos se qualquer um falhar.
            logger.info('Processando usuários: gravar transações, zerar tokens e atualizar saldo');

            // Monta mapa usuario_id → { tokens: [{tokenId, quantidade, valor}], totalValor }
            const dadosPorUsuario = {};
            for (const tokenId in usuariosPorToken) {
                for (const usuario of usuariosPorToken[tokenId]) {
                    if (usuario.usuario_id === 1) continue;

                    const quantidade = typeof usuario.quantidade_tokens === 'number'
                        ? usuario.quantidade_tokens
                        : parseFloat(usuario.quantidade_tokens);

                    if (isNaN(quantidade)) {
                        logger.warn(`Quantidade inválida para o usuário ${usuario.usuario_id} token ${tokenId}`);
                        continue;
                    }

                    const valor = quantidade / 100;
                    const uid = usuario.usuario_id;

                    if (!dadosPorUsuario[uid]) {
                        dadosPorUsuario[uid] = { tokens: [], totalValor: 0 };
                    }
                    dadosPorUsuario[uid].tokens.push({ tokenId, quantidade, valor });
                    dadosPorUsuario[uid].totalValor += valor;
                }
            }

            for (const usuarioId in dadosPorUsuario) {
                const { tokens, totalValor } = dadosPorUsuario[usuarioId];
                const saldoAtual = saldos.find(s => s.usuario_id === parseInt(usuarioId));

                if (!saldoAtual) {
                    logger.warn(`Saldo não encontrado para o usuário ${usuarioId} — pulando`);
                    continue;
                }

                const novoSaldo = parseFloat(saldoAtual.saldo) + totalValor;

                try {
                    await withTransaction(async (conn) => {
                        for (const { tokenId, quantidade, valor } of tokens) {
                            await TransacoesPinsModel.transacoesPins(
                                parseInt(usuarioId), tokenId, quantidade, valor, conn
                            );
                            await ZerarPinsModel.zerarPins(
                                parseInt(tokenId, 10), parseInt(usuarioId, 10), conn
                            );
                        }
                        await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(
                            parseInt(usuarioId), novoSaldo, conn
                        );
                    });
                    logger.info(`Usuário ${usuarioId} processado. Novo saldo: ${novoSaldo.toFixed(8)}`);
                } catch (error) {
                    logger.error(`Erro ao processar usuário ${usuarioId} — rollback executado:`, error);
                    // Continua para os outros usuários
                }
            }

            // Etapa 5: Mover tokens para o Purgatório (por token, após processar todos os usuários)
            logger.info('Movendo tokens para o Purgatório');
            for (const tokenId in tokensTotais) {
                const { totalQuantidade, totalRendimento } = tokensTotais[tokenId];
                try {
                    await MoverPinsModel.moverPins(tokenId, totalQuantidade, totalRendimento);
                    logger.info(`Tokens movidos para Purgatório: token ${tokenId}`);
                } catch (error) {
                    logger.error(`Erro ao mover pins para token ${tokenId}:`, error);
                    // Log e continua — não reverte usuários já processados
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

