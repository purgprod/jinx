// controllers/rotinas/controller_lulu_amortizacao_diaria.js
// Rotina diária da Lulu: deduz X% do rendimento diário de cada usuário
// para amortizar a taxa de cartão (lulu_taxas), em ordem FIFO.
//
// Ordem no cron: após pagamento de rendimento (id:7) e assinatura (id:8).
//
// Fluxo por usuário:
//   1. totalDeducao = rendimento_diario × percentual_deducao / 100
//   2. FIFO nas taxas Ativas: preenche a mais antiga primeiro
//   3. withTransaction: debita carteira + atualiza lulu_taxas + insere lulu_deducoes

const logger = require('../../logger');
const { withTransaction }       = require('../../database/transaction');
const LuluUsuariosModel         = require('../../models/lulu/model_lulu_usuarios_para_deduzir');
const LuluTaxaAtualizarModel    = require('../../models/lulu/model_lulu_taxa_atualizar');
const LuluDeducaoInserirModel   = require('../../models/lulu/model_lulu_deducao_inserir');
const BuscarCarteiraModel       = require('../../models/endpoints/model_buscar_saldo_carteira');
const AtualizarCarteiraModel    = require('../../models/endpoints/model_atualizar_saldo_carteira');

// ---------------------------------------------------------------------------
// BigInt helpers (mesma escala usada no resto do sistema)
// ---------------------------------------------------------------------------
const SCALE   = 8;
const TEN_POW = 10n ** BigInt(SCALE);

function toBig(value) {
    let s = String(value ?? '0').trim();
    if (s === '') return 0n;
    const [i, f = ''] = s.split('.');
    return BigInt(i) * TEN_POW + BigInt(f.slice(0, SCALE).padEnd(SCALE, '0'));
}

function toStr(bi) {
    const abs  = bi < 0n ? -bi : bi;
    const int  = abs / TEN_POW;
    const frac = (abs % TEN_POW).toString().padStart(SCALE, '0').replace(/0+$/, '');
    return (bi < 0n ? '-' : '') + (frac ? `${int}.${frac}` : `${int}`);
}

// ---------------------------------------------------------------------------
const LuluAmortizacaoDiariaController = {
    async executarAmortizacao(req, res) {
        res.status(200).json({ message: 'Rotinas executadas com sucesso' });

        let registros;
        try {
            registros = await LuluUsuariosModel.getRegistros();
        } catch (err) {
            logger.error('[Lulu] Erro ao buscar registros para amortização.', { erro: err.message });
            return;
        }

        if (!registros.length) {
            logger.info('[Lulu] Nenhuma taxa ativa com rendimento hoje. Nada a amortizar.');
            return;
        }

        // Agrupa por usuário mantendo a ordem FIFO (query já ordenada por criado_em ASC)
        const porUsuario = new Map();
        for (const row of registros) {
            if (!porUsuario.has(row.usuario_id)) {
                porUsuario.set(row.usuario_id, {
                    rendimento:        row.rendimento_diario,
                    percentual:        row.percentual_deducao,
                    taxas:             []
                });
            }
            porUsuario.get(row.usuario_id).taxas.push(row);
        }

        let totalUsuarios = 0, totalQuitadas = 0;

        for (const [usuarioId, dados] of porUsuario) {
            // Valor total a deduzir hoje = rendimento × percentual / 100
            const totalDeducaoBig = toBig(dados.rendimento) * toBig(String(dados.percentual)) / toBig('100');
            if (totalDeducaoBig <= 0n) continue;

            // FIFO: distribui o total entre as taxas na ordem de criação
            let restanteDeducao = totalDeducaoBig;
            const operacoes = []; // { taxaId, valorDeduzidoBig, novoRecuperado, quitada }

            for (const taxa of dados.taxas) {
                if (restanteDeducao <= 0n) break;

                const valorRestanteBig = toBig(String(taxa.valor_restante));
                if (valorRestanteBig <= 0n) continue;

                const deduzir         = restanteDeducao < valorRestanteBig ? restanteDeducao : valorRestanteBig;
                const novoRecuperado  = toBig(String(taxa.valor_recuperado)) + deduzir;
                const quitada         = novoRecuperado >= toBig(String(taxa.valor_taxa));

                operacoes.push({ taxaId: taxa.taxa_id, deduzir, novoRecuperado: toStr(novoRecuperado), quitada });
                restanteDeducao -= deduzir;
            }

            if (!operacoes.length) continue;

            const totalDeducaoReal = operacoes.reduce((acc, op) => acc + op.deduzir, 0n);

            try {
                const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(usuarioId);
                if (!carteiraRows?.length) {
                    logger.warn(`[Lulu] Carteira não encontrada. userId=${usuarioId}`);
                    continue;
                }

                const novoSaldo = toStr(toBig(String(carteiraRows[0].saldo ?? '0')) - totalDeducaoReal);

                await withTransaction(async (conn) => {
                    await AtualizarCarteiraModel.updateCarteira(novoSaldo, usuarioId, conn);

                    for (const op of operacoes) {
                        await LuluTaxaAtualizarModel.atualizar(op.taxaId, op.novoRecuperado, op.quitada, conn);
                        await LuluDeducaoInserirModel.inserir(op.taxaId, usuarioId, toStr(op.deduzir), conn);
                        if (op.quitada) totalQuitadas++;
                    }
                });

                logger.info(`[Lulu] Amortização userId=${usuarioId}, deduzido=${toStr(totalDeducaoReal)}, taxas=${operacoes.length}, quitadas=${operacoes.filter(o => o.quitada).length}`);
                totalUsuarios++;

            } catch (err) {
                logger.error(`[Lulu] Erro ao amortizar userId=${usuarioId}.`, { erro: err.message });
            }
        }

        logger.info(`[Lulu] Amortização diária concluída. usuários=${totalUsuarios}, taxas quitadas=${totalQuitadas}`);
    }
};

module.exports = LuluAmortizacaoDiariaController;
