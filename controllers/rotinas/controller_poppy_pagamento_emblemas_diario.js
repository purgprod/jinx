const logger = require('../../logger');
const BuscarSaldosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_saldos_carteiras');
const BuscarEmblemasCarteirasModel = require('../../models/rotinas/model_poppy_buscar_emblemas_carteiras');
const HistoricoPagamentoEmblemasModel = require('../../models/rotinas/model_poppy_historico_pagamento_emblemas');
const AtualizarEmblemasUsuariosModel = require('../../models/rotinas/model_poppy_atualizar_emblemas_usuarios');
const AtualizarFlagEmblemasUsuariosModel = require('../../models/rotinas/model_poppy_atualizar_flag_emblemas_usuarios');
const BuscarUsuariosModel = require('../../models/rotinas/model_manutencao_buscar_usuarios');
const axios = require('axios');

const PagamentoEmblemasController = {
    async executarPagamentoEmblemas(req, res) {
        try {
            // Etapa 1: Coletando a porcentagem a ser paga em Emblemas sobre o saldo
            logger.info('Iniciando etapa 1: Coletando a porcentagem a ser paga em Emblemas');

            const response = await axios.get('http://localhost:3000/api/emblemas/buscar-porcentagem');
            const porcentagemEmblemas = parseFloat(response.data[0].porcentagem_emblemas);            
            logger.info(`Porcentagem de valor pago em Emblemas obtida com sucesso: ${porcentagemEmblemas}%`);

            // Etapa 2: Coletar os saldos
            const saldos = await BuscarSaldosCarteirasModel.getSaldosCarteiras();

            if (!saldos || !saldos.length) {
                logger.warn('Nenhum saldo encontrado');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    data: [],
                    data_consulta: new Date().toISOString().split('T')[0],
                    status: 'concluido',
                });
            }

            const saldosFiltrados = saldos.filter(saldo => saldo.usuario_id !== 1);

            if (!saldosFiltrados.length) {
                logger.warn('Nenhum saldo encontrado após desconsiderar usuario_id 1');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    data: [],
                    data_consulta: new Date().toISOString().split('T')[0],
                    status: 'concluido',
                });
            }

            // Etapa 3: Buscar a quantidade de emblemas para cada usuario_id nos saldos filtrados
            const usuarios = await BuscarUsuariosModel.getUsuarios();
            const usuarioMap = new Map(usuarios.map(usuario => [usuario.usuario_id, usuario]));

            const detalhesEmblemas = [];
            let saldoInferiorAoMinimo = false;

            for (const saldo of saldosFiltrados) {
                const usuario_id = saldo.usuario_id;
                const usuario = usuarioMap.get(usuario_id);

                let flagEmblemas = 1;
                if (usuario && usuario.assinatura === 'Poppy Basic') {
                    flagEmblemas = 0;
                    logger.info(`Usuário ${usuario_id} possui assinatura 'Poppy Basic'. Emblemas não serão pagos.`);
                    continue; // Pular para o próximo usuário
                } else if (saldo.saldo <= 0.01) {
                    flagEmblemas = 0;
                }

                // Atualizar flag_emblemas baseado no saldo e assinatura
                try {
                    await AtualizarFlagEmblemasUsuariosModel.atualizarFlagEmblemas(flagEmblemas, usuario_id);
                    logger.info(`Flag emblemas do usuário ${usuario_id} atualizado para ${flagEmblemas}`);
                } catch (error) {
                    logger.error(`Erro ao atualizar flag emblemas para o usuário ${usuario_id}:`, error);
                }

                if (saldo.saldo <= 0.01) {
                    logger.warn(`Saldo do Usuario ID: ${usuario_id} é inferior ao mínimo de 0.01 para pagamento de emblemas.`);
                    saldoInferiorAoMinimo = true;
                    continue;
                }

                try {
                    const emblemasResult = await BuscarEmblemasCarteirasModel.getEmblemasCarteiras(usuario_id);
                    
                    if (emblemasResult && emblemasResult.length > 0) {
                        const quantidadeEmblemas = emblemasResult[0].emblemas;
                        logger.info(`Usuario ID: ${usuario_id}, Saldo: ${saldo.saldo}, Emblemas Atuais: ${quantidadeEmblemas}`);

                        let valorEmblemas = (saldo.saldo * porcentagemEmblemas) / 100;
                        logger.info(`Usuario ID: ${usuario_id}, Porcentagem Emblemas: ${porcentagemEmblemas}, Valor Emblemas: ${valorEmblemas}`);

                        try {
                            const historicoResult = await HistoricoPagamentoEmblemasModel.historicoPagamentoEmblemas(usuario_id, valorEmblemas);
                            
                            if (historicoResult.affectedRows > 0) {
                                logger.info(`Histórico de pagamento de emblemas registrado com sucesso para o usuário ${usuario_id}`);

                                try {
                                    const atualizarEmblemas = parseFloat(quantidadeEmblemas) + parseFloat(valorEmblemas);
                                    const atualizarResult = await AtualizarEmblemasUsuariosModel.atualizarEmblemas(atualizarEmblemas, usuario_id);

                                    if (atualizarResult.affectedRows > 0) {
                                        logger.info(`Emblemas do usuário ${usuario_id} atualizados para ${atualizarEmblemas} com sucesso.`);
                                    } else {
                                        logger.warn(`Nenhuma linha afetada ao atualizar emblemas do usuário ${usuario_id}.`);
                                    }
                                } catch (atualizarError) {
                                    logger.error(`Erro ao atualizar emblemas do usuário ${usuario_id}:`, atualizarError);
                                }
                            }
                        } catch (historicoError) {
                            logger.error(`Erro ao registrar histórico de pagamento de emblemas para o usuário ${usuario_id}:`, historicoError);
                        }

                        detalhesEmblemas.push({
                            usuario_id: usuario_id,
                            emblemas: quantidadeEmblemas,
                            valorEmblemas: valorEmblemas
                        });
                    } else {
                        logger.warn(`Nenhum emblema encontrado para o usuario_id ${usuario_id}`);

                        let valorEmblemas = (saldo.saldo * porcentagemEmblemas) / 100;
                        logger.info(`Usuario ID: ${usuario_id}, Porcentagem Emblemas: ${porcentagemEmblemas}, Valor Emblemas: ${valorEmblemas}`);

                        try {
                            const historicoResult = await HistoricoPagamentoEmblemasModel.historicoPagamentoEmblemas(usuario_id, valorEmblemas);
                            
                            if (historicoResult.affectedRows > 0) {
                                logger.info(`Histórico de pagamento de emblemas registrado com sucesso para o usuário ${usuario_id}`);

                                try {
                                    const atualizarEmblemas = valorEmblemas;
                                    const atualizarResult = await AtualizarEmblemasUsuariosModel.atualizarEmblemas(atualizarEmblemas, usuario_id);

                                    if (atualizarResult.affectedRows > 0) {
                                        logger.info(`Emblemas do usuário ${usuario_id} atualizados para ${atualizarEmblemas} com sucesso.`);
                                    } else {
                                        logger.warn(`Nenhuma linha afetada ao atualizar emblemas do usuário ${usuario_id}.`);
                                    }
                                } catch (atualizarError) {
                                    logger.error(`Erro ao atualizar emblemas do usuário ${usuario_id}:`, atualizarError);
                                }
                            }
                        } catch (historicoError) {
                            logger.error(`Erro ao registrar histórico de pagamento de emblemas para o usuário ${usuario_id}:`, historicoError);
                        }

                        detalhesEmblemas.push({
                            usuario_id: usuario_id,
                            emblemas: 0,
                            valorEmblemas: valorEmblemas
                        });
                    }
                } catch (error) {
                    logger.error(`Erro ao buscar emblemas para o usuario_id ${usuario_id}:`, error);
                    detalhesEmblemas.push({
                        usuario_id: usuario_id,
                        emblemas: null,
                        error: error.message
                    });
                }
            }

            if (saldoInferiorAoMinimo) {
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    porcentagem_emblemas: porcentagemEmblemas,
                    saldos: saldosFiltrados,
                    detalhes_emblemas: detalhesEmblemas,
                    data_consulta: new Date().toISOString().split('T')[0],
                    status: 'concluido',
                });
            }

            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                porcentagem_emblemas: porcentagemEmblemas,
                saldos: saldosFiltrados,
                detalhes_emblemas: detalhesEmblemas,
                data_consulta: new Date().toISOString().split('T')[0],
                status: 'concluido',
            });

        } catch (error) {
            logger.error('Erro no processamento de pagamento de emblemas:', error);
            
            const errorMessage = error.response 
                ? 'Não foi possível obter a porcentagem de pagamento de emblemas' 
                : 'Ocorreu um erro ao coletar os saldos';

            return res.status(500).json({
                error: 'Erro interno',
                message: errorMessage,
                data: [],
                status: 'falha',
            });
        }
    }
};

module.exports = PagamentoEmblemasController;

