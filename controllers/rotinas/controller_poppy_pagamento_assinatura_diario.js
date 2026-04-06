// controllers/rotinas/controller_poppy_pagamento_assinatura_diario.js
const logger = require('../../logger');
const BuscarRendimentosModel = require('../../models/rotinas/model_poppy_buscar_rendimentos');
const BuscarAssinaturaModel = require('../../models/rotinas/model_poppy_buscar_assinantes');
const AtualizarCarteiraUsuarioModel = require('../../models/rotinas/model_poppy_atualizar_carteiras');
const HistoricoPagamentoAssinaturaModel = require('../../models/rotinas/model_poppy_historico_pagamento_assinatura');
const BuscarHistoricoRendimentoModel = require('../../models/rotinas/model_poppy_buscar_historico_rendimento');
const AtualizarHistoricoRendimentoModel = require('../../models/rotinas/model_poppy_atualizar_historico_rendimento_com_assinatura');
const axios = require('axios');

const PagamentoAssinaturaController = {
    async executePagamentoAssinatura(req, res) {
        logger.info('Iniciando rotina de pagamento da assinatura Poppy Pro');
        const hoje = new Date().toISOString().split('T')[0];
        
        let porcentagemAssinatura = 0;
        let porcentagemDecimal = 0;

        try {
            // --- CONFIGURAÇÃO INICIAL ---
            try {
                const response = await axios.get('http://localhost:3000/api/assinaturas/buscar-porcentagem');
                porcentagemAssinatura = parseFloat(response.data[0].porcentagem_assinatura);
                porcentagemDecimal = porcentagemAssinatura / 100;
                logger.info(`Configuração: ${porcentagemAssinatura}% | Fator: ${porcentagemDecimal}`);
            } catch (error) {
                logger.error('Erro ao buscar porcentagem:', error.message);
                return res.status(500).json({ error: 'Falha na configuração inicial' });
            }

            // --- ETAPA 1: Buscar rendimentos do dia ---
            const rendimentos = await BuscarRendimentosModel.getRendimentos(hoje);
            if (!rendimentos || rendimentos.length === 0) {
                logger.warn(`Nenhum rendimento encontrado para ${hoje}`);
                return res.status(200).json({ message: 'Nada a processar' });
            }

            const rendimentosProcessados = [];
            const usuariosNaoProcessados = [];

            // --- LOOP DE PROCESSAMENTO ---
            for (const rendimento of rendimentos) {
                const usuarioId = rendimento.usuario_id;
                const statusEtapas = { etapa1: 'concluida', etapa2: 'concluida' };

                try {
                    // ETAPA 3: Assinatura
                    const assinaturaData = await BuscarAssinaturaModel.getAssinatura(usuarioId);
                    if (!assinaturaData || assinaturaData.length === 0 || assinaturaData[0].assinatura !== 'Poppy Pro') {
                        throw new Error('Não é assinante Poppy Pro');
                    }
                    statusEtapas.etapa3 = 'concluida';

                    // ETAPA 4: Saldo
                    const saldoResp = await axios.get(`http://localhost:3000/api/usuarios/${usuarioId}/dados-saldo`);
                    const saldoAtual = Number(parseFloat(saldoResp.data.saldo || 0).toFixed(8));
                    statusEtapas.etapa4 = 'concluida';

                    // ETAPA 5: Débito na Carteira
                    const valorAssinatura = Number((rendimento.rendimento_diario * porcentagemDecimal).toFixed(8));
                    const novoSaldo = Number((saldoAtual - valorAssinatura).toFixed(8));
                    await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(usuarioId, novoSaldo);
                    statusEtapas.etapa5 = 'concluida';

                    // ETAPA 6: Histórico de Pagamento
                    await HistoricoPagamentoAssinaturaModel.historicoPagamentoAssinatura(usuarioId, valorAssinatura);
                    statusEtapas.etapa6 = 'concluida';

                    // --- ETAPA 7: ATUALIZAÇÃO DO RENDIMENTO LÍQUIDO ---
                    logger.info(`[ETAPA 7] Iniciando para usuario ${usuarioId}`);
                    try {
                        const registroRendimento = await BuscarHistoricoRendimentoModel.getHistoricoRendimento(usuarioId);
                        
                        if (registroRendimento) {
                            // Correção de Timezone: Extração da data local (YYYY-MM-DD)
                            const d = new Date(registroRendimento.data_criacao);
                            const dataLocalHisto = d.getFullYear() + "-" + 
                                                 String(d.getMonth() + 1).padStart(2, '0') + "-" + 
                                                 String(d.getDate()).padStart(2, '0');
                            
                            if (dataLocalHisto === hoje) {
                                const rendimentoLiquido = Number((registroRendimento.rendimento_diario - valorAssinatura).toFixed(8));
                                
                                logger.info(`[ETAPA 7] Atualizando rendimento ID ${registroRendimento.id} para ${rendimentoLiquido}`);
                                
                                await AtualizarHistoricoRendimentoModel.updateRendimentoComAssinatura(
                                    registroRendimento.id, 
                                    rendimentoLiquido
                                );
                                statusEtapas.etapa7 = 'concluida';
                            } else {
                                logger.info(`[ETAPA 7] Ignorada: data local ${dataLocalHisto} != hoje ${hoje}`);
                                statusEtapas.etapa7 = 'ignorada_data';
                            }
                        } else {
                            logger.warn(`[ETAPA 7] Registro não encontrado para usuario ${usuarioId}`);
                            statusEtapas.etapa7 = 'nao_encontrado';
                        }
                    } catch (err) {
                        logger.error(`[ETAPA 7] Erro interno: ${err.message}`);
                        statusEtapas.etapa7 = 'falha';
                    }

                    rendimentosProcessados.push({ usuario_id: usuarioId, valorAssinatura, statusEtapas });

                } catch (error) {
                    logger.warn(`Erro no usuario ${usuarioId}: ${error.message}`);
                    usuariosNaoProcessados.push({ usuario_id: usuarioId, motivo: error.message });
                }
            }

            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                sucesso: rendimentosProcessados,
                falhas: usuariosNaoProcessados
            });

        } catch (error) {
            logger.error('Erro crítico no controller:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }
};

module.exports = PagamentoAssinaturaController;
