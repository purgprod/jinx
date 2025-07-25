const logger = require('../../logger');
const BuscarSaldosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_saldos_carteiras');
const BuscarEmblemasCarteirasModel = require('../../models/rotinas/model_poppy_buscar_emblemas_carteiras');
const HistoricoPagamentoEmblemasModel = require('../../models/rotinas/model_poppy_historico_pagamento_emblemas');
const AtualizarEmblemasUsuariosModel = require('../../models/rotinas/model_poppy_atualizar_emblemas_usuarios');
const axios = require('axios');

const PagamentoEmblemasController = {
    async executarPagamentoEmblemas(req, res) {
        try {
            // Etapa 1: Coletando a porcentagem a ser paga em Emblemas sobre o saldo
            logger.info('Iniciando etapa 1: Coletando a porcentagem a ser paga em Emblemas');

            // Buscar a porcentagem de pagamento do emblema do endpoint
            const response = await axios.get('http://localhost:3000/api/emblemas/buscar-porcentagem');
            
            // Extrair a porcentagem de emblemas da resposta
            const porcentagemEmblemas = parseFloat(response.data[0].porcentagem_emblemas);            
            logger.info(`Porcentagem de valor pago em Emblemas obtida com sucesso: ${porcentagemEmblemas}%`);

            // Etapa 2: Após obter a porcentagem com sucesso, coletar os saldos
            const saldos = await BuscarSaldosCarteirasModel.getSaldosCarteiras();

            if (!saldos || !saldos.length) {
                logger.warn('Nenhum saldo encontrado');
                return res.status(200).json({
                    message: 'Nenhum saldo encontrado',
                    data: [],
                    data_consulta: new Date().toISOString().split('T')[0],
                    status: 'concluido',
                });
            }

            // Filtrar saldos para desconsiderar o usuario_id 1
            const saldosFiltrados = saldos.filter(saldo => saldo.usuario_id !== 1);

             if (!saldosFiltrados.length) {
                logger.warn('Nenhum saldo encontrado após desconsiderar usuario_id 1');
                return res.status(200).json({
                    message: 'Nenhum saldo encontrado após desconsiderar usuario_id 1',
                    data: [],
                    data_consulta: new Date().toISOString().split('T')[0],
                    status: 'concluido',
                });
            }
            
            // Etapa 3: Buscar a quantidade de emblemas para cada usuario_id nos saldos filtrados
            const detalhesEmblemas = [];
            let saldoInferiorAoMinimo = false; // Variável para controlar se algum saldo é inferior ao mínimo

            for (const saldo of saldosFiltrados) {
                // Etapa 4: Checar se o saldo é maior que 0,01
                if (saldo.saldo <= 0.01) {
                    logger.warn(`Saldo do Usuario ID: ${saldo.usuario_id} é inferior ao mínimo de 0.01 para pagamento de emblemas.`);
                    saldoInferiorAoMinimo = true;
                    continue; // Pula para o próximo usuário
                }

                try {
                    const usuario_id = saldo.usuario_id;
                    const emblemasResult = await BuscarEmblemasCarteirasModel.getEmblemasCarteiras(usuario_id);
                    
                    if (emblemasResult && emblemasResult.length > 0) {
                        const quantidadeEmblemas = emblemasResult[0].emblemas;

                        // Adiciona o log.info com usuario_id, saldo e quantidade de emblemas
                        logger.info(`Usuario ID: ${usuario_id}, Saldo: ${saldo.saldo}, Emblemas Atuais: ${quantidadeEmblemas}`);

                        // Etapa 5: Calcular o valor em emblemas
                        let valorEmblemas = (saldo.saldo * porcentagemEmblemas) / 100;

                        // Adiciona logger.info com usuario_id, porcentagemEmblemas e valorEmblemas
                        logger.info(`Usuario ID: ${usuario_id}, Porcentagem Emblemas: ${porcentagemEmblemas}, Valor Emblemas: ${valorEmblemas}`);

                        // Etapa 6: Registrar histórico de pagamento de emblemas
                        try {
                            const historicoResult = await HistoricoPagamentoEmblemasModel.historicoPagamentoEmblemas(usuario_id, valorEmblemas);
                            
                            if (historicoResult.affectedRows > 0) {
                                logger.info(`Histórico de pagamento de emblemas registrado com sucesso para o usuário ${usuario_id}`);

                                // Etapa 7: Atualizar o valor dos emblemas do usuário
                                try {
                                    // Calcula o novo valor de emblemas
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
                            // Você pode decidir se quer continuar ou parar o processo aqui
                        }

                        detalhesEmblemas.push({
                            usuario_id: usuario_id,
                            emblemas: quantidadeEmblemas,
                            valorEmblemas: valorEmblemas // Adiciona o valor calculado
                        });
                    } else {
                        logger.warn(`Nenhum emblema encontrado para o usuario_id ${usuario_id}`);

                        let valorEmblemas = (saldo.saldo * porcentagemEmblemas) / 100;

                        // Adiciona logger.info com usuario_id, porcentagemEmblemas e valorEmblemas
                        logger.info(`Usuario ID: ${usuario_id}, Porcentagem Emblemas: ${porcentagemEmblemas}, Valor Emblemas: ${valorEmblemas}`);

                        // Etapa 6: Registrar histórico de pagamento de emblemas
                        try {
                            const historicoResult = await HistoricoPagamentoEmblemasModel.historicoPagamentoEmblemas(usuario_id, valorEmblemas);
                            
                            if (historicoResult.affectedRows > 0) {
                                logger.info(`Histórico de pagamento de emblemas registrado com sucesso para o usuário ${usuario_id}`);

                                // Etapa 7: Atualizar o valor dos emblemas do usuário
                                try {
                                    // Calcula o novo valor de emblemas
                                    const atualizarEmblemas = valorEmblemas; // Neste caso, se não tem emblemas, usa apenas o valor calculado

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
                            // Você pode decidir se quer continuar ou parar o processo aqui
                        }

                        detalhesEmblemas.push({
                            usuario_id: usuario_id,
                            emblemas: 0, // Define emblemas como 0 caso não encontre
                            valorEmblemas: valorEmblemas // Adiciona o valor calculado
                        });
                    }
                } catch (error) {
                    logger.error(`Erro ao buscar emblemas para o usuario_id ${saldo.usuario_id}:`, error);
                    detalhesEmblemas.push({
                        usuario_id: saldo.usuario_id,
                        emblemas: null, // Define como nulo para indicar que houve um erro
                        error: error.message // Adiciona a mensagem de erro
                    });
                }
            }

            // Se algum saldo for inferior ao mínimo, retorna a mensagem
            if (saldoInferiorAoMinimo) {
                return res.status(200).json({
                    message: 'Alguns usuários possuem saldo inferior ao mínimo de 0.01 para pagamento de emblemas.',
                    porcentagem_emblemas: porcentagemEmblemas,
                    saldos: saldosFiltrados,
                    detalhes_emblemas: detalhesEmblemas,
                    data_consulta: new Date().toISOString().split('T')[0],
                    status: 'concluido',
                });
            }

            // Resposta com todas as etapas concluídas
            return res.status(200).json({
                message: 'Etapas concluídas: porcentagem de emblemas, saldos, detalhes de emblemas, histórico e atualização coletados',
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

