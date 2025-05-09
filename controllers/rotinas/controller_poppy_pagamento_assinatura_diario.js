const logger = require('../../logger');
const BuscarRendimentosModel = require('../../models/rotinas/model_poppy_buscar_rendimentos');
const BuscarAssinaturaModel = require('../../models/rotinas/model_poppy_buscar_assinantes');
const AtualizarCarteiraUsuarioModel = require('../../models/rotinas/model_poppy_atualizar_carteiras');
const HistoricoPagamentoAssinaturaModel = require('../../models/rotinas/model_poppy_historico_pagamento_assinatura');
const axios = require('axios');

// Definição da porcentagem como uma variável no início do arquivo
const PORCENTAGEM_ASSINATURA = 0.25; // 25% para a assinatura

const PagamentoAssinaturaController = {
    async executePagamentoAssinatura(req, res) {
        logger.info('Iniciando pagamento da assinatura Poppy Pro');

        try {
            // Etapa 1: Buscar rendimentos do dia atual
            logger.info(`Buscando rendimentos pagos na data: ${new Date().toISOString().split('T')[0]}`);
            const rendimentos = await BuscarRendimentosModel.getRendimentos(new Date().toISOString().split('T')[0]);

            if (!rendimentos || !rendimentos.length) {
                logger.warn(`Nenhum rendimento encontrado na data: ${new Date().toISOString().split('T')[0]}`);
                return res.status(200).json({
                    message: `Nenhum rendimento encontrado na data: ${new Date().toISOString().split('T')[0]}`,
                    data: [],
                    data_consulta: new Date().toISOString().split('T')[0],
                    status: 'concluido',
                    etapas: {
                        etapa1: 'concluida',
                        etapa2: 'nao_executada',
                        etapa3: 'nao_executada',
                        etapa4: 'nao_executada',
                        etapa5: 'nao_executada',
                        etapa6: 'nao_executada'
                    }
                });
            }

            // Etapa 2: Coletar os usuários assinantes do dia atual
            logger.info(`Coletando todos os usuários assinantes da data: ${new Date().toISOString().split('T')[0]}`);
            const rendimentosProcessados = [];
            const usuariosNaoProcessados = [];
            const statusEtapas = {
                etapa1: 'concluida',
                etapa2: 'concluida',
                etapa3: 'nao_iniciada',
                etapa4: 'nao_iniciada',
                etapa5: 'nao_iniciada',
                etapa6: 'nao_iniciada'
            };

            for (const rendimento of rendimentos) {
                try {
                    // Etapa 3: Buscar tipo de assinatura do usuário
                    try {
                        const assinatura = await BuscarAssinaturaModel.getAssinatura(rendimento.usuario_id);
                        statusEtapas.etapa3 = 'concluida';

                        if (!assinatura || !assinatura.length || assinatura[0].assinatura !== 'Poppy Pro') {
                            statusEtapas.etapa3 = 'falha';
                            throw new Error('Assinatura não é Poppy Pro');
                        }

                        // Etapa 4: Obter o saldo atual da carteira do usuário
                        try {
                            const saldoResponse = await axios.get(`http://localhost:3000/api/usuarios/${rendimento.usuario_id}/dados-saldo`);
                            let saldoAtual = saldoResponse.data.saldo || '0.00';
                            
                            saldoAtual = Number(parseFloat(saldoAtual).toFixed(8));
                            statusEtapas.etapa4 = 'concluida';

                            // Etapa 5: Calcular o novo saldo
                            try {
                                const valorAssinatura = Number((rendimento.rendimento_diario * PORCENTAGEM_ASSINATURA).toFixed(8));
                                const novoSaldo = Number((Number(saldoAtual) - Number(valorAssinatura)).toFixed(8));

                                // Atualizar a carteira com o novo saldo usando o modelo
                                const resultadoAtualizacao = await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(
                                    rendimento.usuario_id,
                                    novoSaldo
                                );

                                if (resultadoAtualizacao.affectedRows > 0) {
                                    statusEtapas.etapa5 = 'concluida';
                                    logger.info(`Saldo da carteira do usuário ${rendimento.usuario_id} atualizado com sucesso`);
                                } else {
                                    statusEtapas.etapa5 = 'falha';
                                    logger.warn(`Falha ao atualizar o saldo da carteira do usuário ${rendimento.usuario_id}`);
                                    throw new Error('Atualização do saldo não teve efeito algum');
                                }

                                // Etapa 6: Registrar o histórico de pagamento da assinatura
                                try {
                                    const resultadoHistorico = await HistoricoPagamentoAssinaturaModel.historicoPagamentoAssinatura(
                                        rendimento.usuario_id,
                                        valorAssinatura
                                    );

                                    if (resultadoHistorico.affectedRows > 0) {
                                        statusEtapas.etapa6 = 'concluida';
                                        logger.info(`Registro de histórico do pagamento da assinatura do usuário ${rendimento.usuario_id} realizado com sucesso`);
                                    } else {
                                        statusEtapas.etapa6 = 'falha';
                                        logger.warn(`Falha ao registrar o histórico do pagamento da assinatura do usuário ${rendimento.usuario_id}`);
                                        throw new Error('Registro do histórico não teve efeito algum');
                                    }
                                } catch (error) {
                                    statusEtapas.etapa6 = 'falha';
                                    logger.error(`Erro ao registrar o histórico do pagamento da assinatura do usuário ${rendimento.usuario_id}:`, error);
                                    throw error;
                                }

                                rendimentosProcessados.push({
                                    id: rendimento.id,
                                    data_criacao: rendimento.data_criacao,
                                    usuario_id: rendimento.usuario_id,
                                    rendimento_diario: rendimento.rendimento_diario,
                                    valorAssinatura: valorAssinatura,
                                    saldoAtual: saldoAtual,
                                    novoSaldo: novoSaldo,
                                    assinatura: assinatura[0].assinatura,
                                    status: {
                                        etapa1: statusEtapas.etapa1,
                                        etapa2: statusEtapas.etapa2,
                                        etapa3: statusEtapas.etapa3,
                                        etapa4: statusEtapas.etapa4,
                                        etapa5: statusEtapas.etapa5,
                                        etapa6: statusEtapas.etapa6
                                    }
                                });

                            } catch (error) {
                                statusEtapas.etapa5 = 'falha';
                                logger.error(`Erro ao atualizar o saldo da carteira do usuário ${rendimento.usuario_id}:`, error);
                                throw error;
                            }

                        } catch (error) {
                            statusEtapas.etapa4 = 'falha';
                            logger.error(`Erro ao obter o saldo atual da carteira do usuário ${rendimento.usuario_id}:`, error);
                            throw error;
                        }

                    } catch (error) {
                        statusEtapas.etapa3 = 'falha';
                        logger.error(`Erro ao verificar a assinatura do usuário ${rendimento.usuario_id}:`, error);
                        throw error;
                    }

                } catch (error) {
                    statusEtapas.etapa3 = 'falha';
                    logger.error(`Erro ao processar rendimento do usuário ${rendimento.usuario_id}:`, error);
                    usuariosNaoProcessados.push({
                        usuario_id: rendimento.usuario_id,
                        motivo: error.message || 'Erro ao processar rendimento'
                    });
                }
            }

            // Resposta final com detalhes de processamento
            logger.info(`Busca pelos usuários assinantes concluída com sucesso na data: ${new Date().toISOString().split('T')[0]}`);
            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                data: rendimentosProcessados,
                total_processados: rendimentosProcessados.length,
                total_registrados: rendimentosProcessados.length,
                usuarios_nao_processados: usuariosNaoProcessados,
                data_consulta: new Date().toISOString().split('T')[0],
                status_geral: {
                    etapa1: statusEtapas.etapa1,
                    etapa2: statusEtapas.etapa2,
                    etapa3: statusEtapas.etapa3,
                    etapa4: statusEtapas.etapa4,
                    etapa5: statusEtapas.etapa5,
                    etapa6: statusEtapas.etapa6
                }
            });

        } catch (error) {
            logger.error('Erro inesperado:', error);
            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro inesperado durante a execução da rotina',
                data: [],
                status_geral: {
                    etapa1: 'concluida',
                    etapa2: 'falha',
                    etapa3: 'nao_iniciada',
                    etapa4: 'nao_iniciada',
                    etapa5: 'nao_iniciada',
                    etapa6: 'nao_iniciada'
                }
            });
        }
    }
};

module.exports = PagamentoAssinaturaController;

