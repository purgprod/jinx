// services/vender_todos_pins_service.js
// Lógica central de venda de todos os Pins dos clientes.
// Chamado pelo controller de rotina E pelo controller de ativação de token.

'use strict';

const logger = require('../logger');
const { withTransaction } = require('../database/transaction');
const { executarCompraDiariaPins } = require('./compra_diaria_pins_service');
const BuscarTodosPinsClientesModel = require('../models/rotinas/model_poppy_buscar_todos_pins_clientes');
const BuscarSaldosCarteirasModel = require('../models/rotinas/model_poppy_buscar_saldos_carteiras');
const AtualizarCarteiraUsuarioModel = require('../models/rotinas/model_poppy_atualizar_carteiras');
const TransacoesPinsModel = require('../models/rotinas/model_poppy_transacoes_pins_para_purg');
const ZerarPinsModel = require('../models/rotinas/model_poppy_zerar_pins_para_clientes');
const MoverPinsModel = require('../models/rotinas/model_poppy_mover_pins_para_purg');

const TOKEN_PRICE = 0.01;

/**
 * Vende todos os Pins de todos os clientes, devolvendo o valor em saldo.
 * @returns {{ total_usuarios: number, total_posicoes: number, detalhes: Array, erros: Array }}
 */
async function executarVendaTodosPins() {
    logger.info('[VENDA] Iniciando venda de todos os Pins dos clientes');

    const todasPosicoes = await BuscarTodosPinsClientesModel.getTodosPins();

    if (!todasPosicoes.length) {
        logger.info('[VENDA] Nenhuma posição encontrada. Ambiente já está limpo.');
        return { total_usuarios: 0, total_posicoes: 0, detalhes: [], erros: [] };
    }

    logger.info(`[VENDA] ${todasPosicoes.length} posição(ões) encontrada(s) para venda`);

    const dadosPorUsuario = {};
    for (const pos of todasPosicoes) {
        const uid = pos.usuario_id;
        if (!dadosPorUsuario[uid]) dadosPorUsuario[uid] = { tokens: [], totalValor: 0 };
        const valor = pos.quantidade_tokens * TOKEN_PRICE;
        dadosPorUsuario[uid].tokens.push({ token_id: pos.token_id, quantidade: pos.quantidade_tokens, risco: pos.risco, valor });
        dadosPorUsuario[uid].totalValor += valor;
    }

    const saldos = await BuscarSaldosCarteirasModel.getSaldosCarteiras();

    const detalhes = [];
    const erros = [];

    for (const usuarioId in dadosPorUsuario) {
        const { tokens, totalValor } = dadosPorUsuario[usuarioId];
        const uid = parseInt(usuarioId, 10);

        const saldoAtual = saldos.find(s => s.usuario_id === uid);
        if (!saldoAtual) {
            logger.warn(`[VENDA] Saldo não encontrado para o usuário ${uid} — pulando`);
            erros.push({ usuario_id: uid, error: 'Saldo não encontrado' });
            continue;
        }

        const novoSaldo = parseFloat(saldoAtual.saldo) + totalValor;

        try {
            await withTransaction(async (conn) => {
                for (const { token_id, quantidade, risco, valor } of tokens) {
                    await TransacoesPinsModel.transacoesPins(uid, token_id, quantidade, valor, conn);
                    await ZerarPinsModel.zerarPins(parseInt(token_id, 10), uid, conn);
                    if (risco !== 'EMB') {
                        await MoverPinsModel.devolverPins(parseInt(token_id, 10), quantidade, conn);
                    }
                }
                await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(uid, novoSaldo, conn);
            });

            logger.info(`[VENDA] Usuário ${uid}: ${tokens.length} token(s) vendido(s), saldo +R$ ${totalValor.toFixed(8)} → novo saldo R$ ${novoSaldo.toFixed(8)}`);
            detalhes.push({ usuario_id: uid, tokens_vendidos: tokens.length, valor_devolvido: totalValor, novo_saldo: novoSaldo });
        } catch (error) {
            logger.error(`[VENDA] Erro ao processar usuário ${uid} — rollback: ${error.message}`);
            erros.push({ usuario_id: uid, error: error.message });
        }
    }

    logger.info(`[VENDA] Concluído. ${detalhes.length} usuário(s) processado(s), ${erros.length} erro(s).`);
    const resultado = { total_usuarios: detalhes.length, total_posicoes: todasPosicoes.length, detalhes, erros };

    logger.info('[VENDA] Iniciando compra diária de Pins na sequência da venda');
    try {
        await executarCompraDiariaPins();
    } catch (error) {
        logger.error(`[VENDA] Erro na compra diária após venda: ${error.message}`);
    }

    return resultado;
}

module.exports = { executarVendaTodosPins };
