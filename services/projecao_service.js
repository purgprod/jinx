// services/projecao_service.js
// Simula a evolução do patrimônio e do rendimento mensal do usuário mês a mês,
// desde hoje até a data_limite da última meta ativa.
//
// Modelo de simulação:
//   A cada mês:
//     1. Tokens que vencem naquele mês retornam o valor (qtd × R$0,01) como saldo.
//     2. Rendimento do mês = SUM(quantidade × rendimento_token × 30) dos pins vigentes.
//     3. Aporte do mês = soma dos objetivo_investir das metas com data_limite naquele mês.
//     4. Capital disponível = rendimento + aporte + saldo_residual + retorno_vencimentos.
//     5. Novos pins comprados (50% EMB, 50% empresa) com rendimento médio atual.
//     6. Patrimônio = total_pins × R$0,01 + saldo_residual.
//     7. Rendimento_mensal = SUM(quantidade × rendimento_token × 30) pós-compra.

'use strict';

const ProjecaoLeitura = require('../models/projecao/model_projecao_leitura');

const TOKEN_PRICE = 0.01;
const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function mesCod(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mesLabel(d) {
    return `${MESES_PT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Gera a projeção de patrimônio e rendimento mensal para o usuário.
 *
 * @param {number} usuarioId
 * @returns {{ patrimonio: Array, rendimento: Array }}
 *   patrimonio: [{mes, label, valor}]
 *   rendimento: [{mes, label, valor}]
 */
async function gerarProjecao(usuarioId) {
    const [holdings, saldo, metas, rendMedioEmb, rendMedioEmpresa] = await Promise.all([
        ProjecaoLeitura.buscarHoldings(usuarioId),
        ProjecaoLeitura.buscarSaldo(usuarioId),
        ProjecaoLeitura.buscarMetasAtivas(usuarioId),
        ProjecaoLeitura.buscarRendimentoMedioEmb(),
        ProjecaoLeitura.buscarRendimentoMedioEmpresa(),
    ]);

    if (!metas.length) {
        return { patrimonio: [], rendimento: [] };
    }

    // Mapa mês → total de aportes: { 'YYYY-MM': valor }
    const mapaAportes = {};
    let dataFim = null;

    for (const meta of metas) {
        const d = new Date(meta.data_limite);
        const key = mesCod(d);
        mapaAportes[key] = (mapaAportes[key] || 0) + parseFloat(meta.objetivo_investir);
        if (!dataFim || d > dataFim) dataFim = d;
    }

    // Estado da simulação: grupos de pins { quantidade, rendimentoToken, ano/mes de vencimento ou null }
    const pinGroups = holdings.map(h => ({
        quantidade: h.quantidade_tokens,
        rendimentoToken: parseFloat(h.rendimento_token),
        anoVenc: h.vencimento ? new Date(h.vencimento).getFullYear() : null,
        mesVenc: h.vencimento ? new Date(h.vencimento).getMonth()   : null,
    }));

    let saldoResidual = saldo;

    const patrimonioPontos = [];
    const rendimentoPontos = [];

    const hoje = new Date();
    let cursor = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim   = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1);

    while (cursor <= fim) {
        const mesKey = mesCod(cursor);
        const label  = mesLabel(cursor);
        const cAno   = cursor.getFullYear();
        const cMes   = cursor.getMonth();

        // 1. Tokens que vencem neste mês: retornam o valor como saldo e saem da carteira
        let saldoDeVencimentos = 0;
        for (const g of pinGroups) {
            if (g.anoVenc === cAno && g.mesVenc === cMes) {
                saldoDeVencimentos += g.quantidade * TOKEN_PRICE;
                g.quantidade = 0;
            }
        }

        // 2. Rendimento mensal dos pins vigentes (antes das novas compras)
        const rendimentoMes = pinGroups.reduce((s, g) => s + g.quantidade * g.rendimentoToken * 30, 0);

        // 3. Aporte das metas deste mês
        const aporteMes = mapaAportes[mesKey] || 0;

        // 4. Capital disponível
        const capital = rendimentoMes + aporteMes + saldoResidual + saldoDeVencimentos;

        // 5. Comprar novos pins: 50% EMB, 50% empresa
        const totalNovos   = Math.floor(capital / TOKEN_PRICE);
        const novosEmb     = Math.floor(totalNovos * 0.5);
        const novosEmpresa = totalNovos - novosEmb;
        saldoResidual = capital - totalNovos * TOKEN_PRICE;

        if (novosEmb > 0) {
            pinGroups.push({ quantidade: novosEmb, rendimentoToken: rendMedioEmb, anoVenc: null, mesVenc: null });
        }
        if (novosEmpresa > 0) {
            pinGroups.push({ quantidade: novosEmpresa, rendimentoToken: rendMedioEmpresa, anoVenc: null, mesVenc: null });
        }

        // 6. Patrimônio e rendimento pós-compra
        const totalPins       = pinGroups.reduce((s, g) => s + g.quantidade, 0);
        const patrimonio      = totalPins * TOKEN_PRICE + saldoResidual;
        const rendimentoFinal = pinGroups.reduce((s, g) => s + g.quantidade * g.rendimentoToken * 30, 0);

        patrimonioPontos.push({ mes: mesKey, label, valor: parseFloat(patrimonio.toFixed(2)) });
        rendimentoPontos.push({ mes: mesKey, label, valor: parseFloat(rendimentoFinal.toFixed(8)) });

        cursor = new Date(cAno, cMes + 1, 1);
    }

    return { patrimonio: patrimonioPontos, rendimento: rendimentoPontos };
}

module.exports = { gerarProjecao };
