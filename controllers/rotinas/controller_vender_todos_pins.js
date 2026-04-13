// controllers/rotinas/controller_vender_todos_pins.js
//
// Endpoint de sanitização: vende todos os Pins de todos os clientes,
// devolvendo o valor em saldo (quantidade_tokens * R$ 0,01).
//
// Para cada usuário (em transação atômica):
//   1. Registra uma transação do tipo 'V' para cada token
//   2. Zera quantidade_tokens e rendimento_token em usuario_tokens
//   3. Credita o valor total de volta no saldo da carteira

const logger = require('../../logger');
const { withTransaction } = require('../../database/transaction');
const BuscarTodosPinsClientesModel = require('../../models/rotinas/model_poppy_buscar_todos_pins_clientes');
const BuscarSaldosCarteirasModel = require('../../models/rotinas/model_poppy_buscar_saldos_carteiras');
const AtualizarCarteiraUsuarioModel = require('../../models/rotinas/model_poppy_atualizar_carteiras');
const TransacoesPinsModel = require('../../models/rotinas/model_poppy_transacoes_pins_para_purg');
const ZerarPinsModel = require('../../models/rotinas/model_poppy_zerar_pins_para_clientes');
const MoverPinsModel = require('../../models/rotinas/model_poppy_mover_pins_para_purg');

const TOKEN_PRICE = 0.01; // R$ por token — valor fixo de toda a plataforma

const VenderTodosPinsController = {
    async executarVendaTodosPins(req, res) {
        logger.info('[VENDA] Iniciando venda de todos os Pins dos clientes');

        try {
            // Etapa 1: Buscar todas as posições dos clientes
            const todasPosicoes = await BuscarTodosPinsClientesModel.getTodosPins();

            if (!todasPosicoes.length) {
                logger.info('[VENDA] Nenhuma posição encontrada. Ambiente já está limpo.');
                return res.status(200).json({
                    message: 'Nenhuma posição encontrada. Ambiente já está limpo.',
                    total_usuarios: 0,
                    total_posicoes: 0,
                    detalhes: []
                });
            }

            logger.info(`[VENDA] ${todasPosicoes.length} posição(ões) encontrada(s) para venda`);

            // Etapa 2: Agrupar por usuario_id
            const dadosPorUsuario = {};
            for (const pos of todasPosicoes) {
                const uid = pos.usuario_id;
                if (!dadosPorUsuario[uid]) {
                    dadosPorUsuario[uid] = { tokens: [], totalValor: 0 };
                }
                const valor = pos.quantidade_tokens * TOKEN_PRICE;
                dadosPorUsuario[uid].tokens.push({
                    token_id: pos.token_id,
                    quantidade: pos.quantidade_tokens,
                    risco: pos.risco,
                    valor
                });
                dadosPorUsuario[uid].totalValor += valor;
            }

            // Etapa 3: Buscar saldos atuais das carteiras
            const saldos = await BuscarSaldosCarteirasModel.getSaldosCarteiras();

            // Etapa 4: Para cada usuário, executar venda atomicamente
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
                            // EMB não volta para a Purg — estoque ilimitado gerenciado direto na tabela tokens
                            if (risco !== 'EMB') {
                                await MoverPinsModel.devolverPins(parseInt(token_id, 10), quantidade, conn);
                            }
                        }
                        await AtualizarCarteiraUsuarioModel.atualizarCarteiraUsuario(uid, novoSaldo, conn);
                    });

                    logger.info(`[VENDA] Usuário ${uid}: ${tokens.length} token(s) vendido(s), saldo +R$ ${totalValor.toFixed(8)} → novo saldo R$ ${novoSaldo.toFixed(8)}`);

                    detalhes.push({
                        usuario_id: uid,
                        tokens_vendidos: tokens.length,
                        valor_devolvido: totalValor,
                        novo_saldo: novoSaldo
                    });
                } catch (error) {
                    logger.error(`[VENDA] Erro ao processar usuário ${uid} — rollback: ${error.message}`);
                    erros.push({ usuario_id: uid, error: error.message });
                }
            }

            logger.info(`[VENDA] Concluído. ${detalhes.length} usuário(s) processado(s), ${erros.length} erro(s).`);

            return res.status(200).json({
                message: 'Venda de todos os Pins concluída',
                total_usuarios: detalhes.length,
                total_posicoes: todasPosicoes.length,
                detalhes,
                erros
            });

        } catch (error) {
            logger.error('[VENDA] Erro inesperado na venda de todos os Pins:', error);
            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro inesperado durante a venda dos Pins'
            });
        }
    }
};

module.exports = VenderTodosPinsController;
