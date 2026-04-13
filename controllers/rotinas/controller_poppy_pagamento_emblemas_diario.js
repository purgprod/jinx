// controllers/rotinas/controller_poppy_pagamento_emblemas_diario.js
//
// Rotina que atualiza o rendimento_token diário de todos os usuários
// que possuem Pins de Emblema (risco = 'EMB').
//
// Executa ANTES da rotina de pagamento de rendimentos (id: 7) para que
// os valores já estejam corretos quando o pagamento for processado.
//
// Cálculo:
//   rendimento_diario_por_token = (taxa_anual / 100 / 365) * valor_token_unitario (R$ 0,01)
//   rendimento_usuario           = quantidade_tokens * rendimento_diario_por_token
//
// A taxa anual (% a.a.) é configurada pelo admin no painel Jinx via
// GET  /api/emblemas/buscar-porcentagem
// PUT  /api/emblemas/atualizar-porcentagem

const logger = require('../../logger');
const axios = require('axios');
const BuscarHoldersTokensEmbModel = require('../../models/rotinas/model_poppy_buscar_holders_tokens_emb');
const AtualizarRendimentoEmbModel = require('../../models/rotinas/model_poppy_atualizar_rendimento_emb');
const HistoricoPagamentoEmblemasModel = require('../../models/rotinas/model_poppy_historico_pagamento_emblemas');

const VALOR_TOKEN_UNITARIO = 0.01; // R$ por token — mesmo valor usado em toda a plataforma
const IR_ALIQUOTA = 0.15;          // 15% de IR sobre rendimentos (equivalente a CDB)

const AtualizarRendimentoEmblemasController = {
    async executarPagamentoEmblemas(req, res) {
        try {
            // Etapa 1: Buscar a taxa anual configurada pelo admin
            logger.info('[EMB] Etapa 1: Buscando taxa anual dos Pins de Emblema');

            const response = await axios.get('http://localhost:3000/api/emblemas/buscar-porcentagem');
            const taxaAnual = parseFloat(response.data[0].porcentagem_emblemas);

            if (isNaN(taxaAnual) || taxaAnual <= 0) {
                logger.warn(`[EMB] Taxa anual inválida ou zero (${taxaAnual}). Rotina encerrada sem atualizações.`);
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    status: 'concluido',
                    detalhe: 'Taxa anual zerada ou não configurada — nenhum rendimento atualizado',
                    taxa_anual: taxaAnual,
                    atualizacoes: []
                });
            }

            logger.info(`[EMB] Taxa anual configurada: ${taxaAnual}% a.a.`);

            // Etapa 2: Calcular o rendimento diário por token líquido de IR (15%)
            // Fórmula: (taxa_anual / 100 / 365) * valor_token_unitario * (1 - IR_ALIQUOTA)
            const rendimentoDiarioPorToken = (taxaAnual / 100 / 365) * VALOR_TOKEN_UNITARIO * (1 - IR_ALIQUOTA);
            logger.info(`[EMB] Rendimento diário por token líq. IR ${IR_ALIQUOTA * 100}%: R$ ${rendimentoDiarioPorToken.toFixed(10)}`);

            // Etapa 3: Buscar todos os usuários que possuem tokens EMB
            logger.info('[EMB] Etapa 3: Buscando holders de tokens EMB');
            const holders = await BuscarHoldersTokensEmbModel.getHolders();

            if (!holders || holders.length === 0) {
                logger.warn('[EMB] Nenhum holder de token EMB encontrado. Nada a atualizar.');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    status: 'concluido',
                    detalhe: 'Nenhum usuário possui Pins de Emblema',
                    taxa_anual: taxaAnual,
                    rendimento_diario_por_token: rendimentoDiarioPorToken,
                    atualizacoes: []
                });
            }

            logger.info(`[EMB] ${holders.length} posição(ões) EMB encontrada(s)`);

            // Etapa 4: Atualizar rendimento_token para cada posição
            logger.info('[EMB] Etapa 4: Atualizando rendimento_token nas posições EMB');
            const atualizacoes = [];
            const erros = [];

            for (const holder of holders) {
                const { usuario_id, token_id, quantidade_tokens } = holder;
                const rendimentoUsuario = quantidade_tokens * rendimentoDiarioPorToken;

                try {
                    await AtualizarRendimentoEmbModel.atualizarRendimento(
                        usuario_id,
                        token_id,
                        rendimentoUsuario
                    );

                    // Grava o rendimento EMB do usuário na tabela emblemas
                    // para manter o histórico de pagamentos visível no painel Jinx
                    await HistoricoPagamentoEmblemasModel.historicoPagamentoEmblemas(
                        usuario_id,
                        rendimentoUsuario
                    );

                    atualizacoes.push({
                        usuario_id,
                        token_id,
                        quantidade_tokens,
                        rendimento_diario: rendimentoUsuario
                    });

                    logger.info(`[EMB] Usuário ${usuario_id} | Token ${token_id} | Qtd: ${quantidade_tokens} | Rendimento: R$ ${rendimentoUsuario.toFixed(8)}`);
                } catch (error) {
                    logger.error(`[EMB] Erro ao atualizar rendimento para usuário ${usuario_id} token ${token_id}: ${error.message}`);
                    erros.push({ usuario_id, token_id, error: error.message });
                }
            }

            logger.info(`[EMB] Rotina concluída. ${atualizacoes.length} atualização(ões), ${erros.length} erro(s).`);

            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                status: 'concluido',
                taxa_anual: taxaAnual,
                rendimento_diario_por_token: rendimentoDiarioPorToken,
                total_posicoes: holders.length,
                atualizacoes,
                erros
            });

        } catch (error) {
            logger.error('[EMB] Erro inesperado na rotina de atualização de rendimento EMB:', error);

            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro ao atualizar os rendimentos dos Pins de Emblema',
                status: 'falha'
            });
        }
    }
};

module.exports = AtualizarRendimentoEmblemasController;
