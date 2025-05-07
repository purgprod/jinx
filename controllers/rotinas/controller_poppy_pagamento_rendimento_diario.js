const logger = require('../../logger');
const BuscarPinsModel = require('../../models/rotinas/model_poppy_buscar_pins');
const BuscarUsuariosQuantidadeRendimentoPinsModel = require('../../models/rotinas/model_poppy_buscar_usuarios_quantidade_rendimento_pins');
const BuscarSaldosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_saldos_carteiras');
const AtualizarCarteiraUsuarioModel = require('../../models/rotinas/model_poppy_atualizar_carteiras');
const RendimentosPinsModel = require('../../models/rotinas/model_poppy_historico_rendimentos');

const MAX_USUARIOS_LOG = process.env.MAX_USUARIOS_LOG || 100;

const PagamentoRendimentoDiarioController = {
    async executePagamentoRendimentoDiario(req, res) {
        logger.info('Iniciando pagamento de rendimento diário');

        try {
            // Etapa 1: Buscar Pins ativos
            const pinsAtivos = await BuscarPinsModel.getPins();

            if (!pinsAtivos.length) {
                logger.warn('Nenhum Pin ativo encontrado');
                return res.status(200).json({
                    message: 'Nenhum Pin ativo encontrado.',
                    pinsAtivos: [],
                    usuariosPorToken: {},
                });
            }

            // Etapa 2: Buscar usuários por Pin
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
                    message: 'Nenhum Pin válido encontrado.',
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
                    message: 'Nenhum usuário encontrado.',
                    pinsAtivos: pinsAtivos,
                    usuariosPorToken: {},
                });
            }

            // Etapa 3: Calcular total de rendimentos por usuário
            logger.info('Calculando total de rendimentos por usuário');
            const totalRendimentosPorUsuario = {};

            for (const tokenId in usuariosPorToken) {
                const usuarios = usuariosPorToken[tokenId];
                
                for (const usuario of usuarios) {
                    try {
                        // Garantir que o rendimento_token é um número válido
                        const rendimento = typeof usuario.rendimento_token === 'number' ? 
                            usuario.rendimento_token : parseFloat(usuario.rendimento_token);

                        if (isNaN(rendimento)) {
                            logger.warn(`Rendimento inválido para o usuário ${usuario.usuario_id}`);
                            continue;
                        }

                        const usuarioId = usuario.usuario_id;
                        if (!totalRendimentosPorUsuario[usuarioId]) {
                            totalRendimentosPorUsuario[usuarioId] = 0;
                        }

                        totalRendimentosPorUsuario[usuarioId] += rendimento;

                        logger.info(`Atualizando total de rendimentos para usuário ${usuarioId}: ${rendimento}`);

                    } catch (error) {
                        logger.error(`Erro ao processar usuário ${usuario.usuario_id}:`, error);
                        continue;
                    }
                }
            }

            if (Object.keys(totalRendimentosPorUsuario).length === 0) {
                logger.warn('Nenhum rendimento válido foi calculado');
                return res.status(200).json({
                    message: 'Nenhum rendimento válido foi calculado.',
                    pinsAtivos: pinsAtivos,
                    usuariosPorToken: {},
                    totalRendimentos: {}
                });
            }

            // Etapa 4: Buscar os saldos atuais das carteiras
            logger.info('Buscando saldos atuais das carteiras');
            const saldos = await BuscarSaldosCarteirasModel.getSaldosCarteiras();

            if (!saldos.length) {
                logger.warn('Nenhum saldo encontrado nas carteiras');
                return res.status(200).json({
                    message: 'Nenhum saldo encontrado nas carteiras.',
                    pinsAtivos: pinsAtivos,
                    usuariosPorToken: {},
                    totalRendimentos: totalRendimentosPorUsuario
                });
            }

            // Etapa 5: Atualizar o saldo da carteira e registrar o histórico
            logger.info('Atualizando saldos e registrando histórico');
            const atualizacoes = [];

            for (const usuarioId in totalRendimentosPorUsuario) {
                const rendimentoTotal = totalRendimentosPorUsuario[usuarioId];

                try {
                    // Encontrar o saldo atual do usuário
                    const saldoAtual = saldos.find(saldo => saldo.usuario_id === parseInt(usuarioId));

                    if (!saldoAtual) {
                        logger.warn(`Nenhum saldo encontrado para o usuário ${usuarioId}`);
                        continue;
                    }

                    // Calcular o novo saldo
                    const novoSaldo = parseFloat(saldoAtual.saldo) + rendimentoTotal;
                    // Atualizar o saldo da carteira
                    const resultadoAtualizacao = await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(
                        parseInt(usuarioId),
                        novoSaldo
                    );

                    // Registrar o histórico de rendimentos
                    const resultadoRegistro = await RendimentosPinsModel.rendimentosPins(
                        parseInt(usuarioId),
                        rendimentoTotal
                    );

                    atualizacoes.push({
                        usuario_id: usuarioId,
                        saldo_anterior: saldoAtual.saldo,
                        rendimento_total: rendimentoTotal,
                        novo_saldo: novoSaldo,
                        registro_historico: {
                            affectedRows: resultadoRegistro.affectedRows,
                            insertId: resultadoRegistro.insertId
                        }
                    });

                    logger.info(`Saldo da carteira atualizado com sucesso para o usuário ${usuarioId}`);
                    logger.info(`Novo saldo: ${novoSaldo.toFixed(8)}`);
                    logger.info(`Registro de histórico concluído com sucesso`);

                } catch (error) {
                    logger.error(`Erro ao processar usuário ${usuarioId}:`, error);
                    logger.error(`Mensagem do erro: ${error.message}`);
                    continue;
                }
            }

            // Etapa 6: Executar a manutenção do ranking dos usuários
            logger.info('Iniciando manutenção do ranking dos usuários');
            let responseManutencaoRanking = null;

            try {
                const response = await fetch('http://localhost:3000/api/rotinas/manutencao-ranking-usuarios', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                responseManutencaoRanking = {
                    status: response.ok,
                    dados: await response.json()
                };

                if (!response.ok) {
                    logger.warn('Erro ao executar manutenção do ranking dos usuários');
                    logger.warn(`Resposta do servidor: ${response.status} ${response.statusText}`);
                } else {
                    logger.info('Manutenção do ranking dos usuários executada com sucesso');
                    logger.info(`Resposta da API: ${JSON.stringify(responseManutencaoRanking.dados)}`);
                }

            } catch (error) {
                logger.error(`Erro ao executar manutenção do ranking dos usuários:`, error);
                logger.error(`Mensagem do erro: ${error.message}`);
                responseManutencaoRanking = {
                    status: false,
                    dados: {},
                    error: error.message
                };
            }

            // Resposta final
            logger.info('Rotina concluída com sucesso');
            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                pinsAtivos: pinsAtivos,
                usuariosPorToken: usuariosPorToken,
                totalRendimentos: totalRendimentosPorUsuario,
                atualizacoes: atualizacoes,
                manutencaoRanking: responseManutencaoRanking
            });

        } catch (error) {
            logger.error('Erro inesperado:', error);
            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro inesperado durante a execução da rotina',
                pinsAtivos: [],
                usuariosPorToken: {},
                totalRendimentos: {}
            });
        }
    },
};

module.exports = PagamentoRendimentoDiarioController;

