// scripts/setup_objetivos_usuario2.js
//
// Script de setup retroativo para o usuário 2.
// 1 objetivo: Patrimônio (is_patrimonio=true)
//   Meta 1 → R$100 (compromisso inicial, já alocado retroativamente)
//   Metas 2–9 → R$62,50 cada (R$500 restantes ÷ 8 meses)
//
// Executar: node scripts/setup_objetivos_usuario2.js

'use strict';

require('dotenv').config();

const pool                                     = require('../database/database_purg');
const { withTransaction }                      = require('../database/transaction');
const ObjetivosEscrita                         = require('../models/objetivos/model_objetivos_escrita');
const MetasEscrita                             = require('../models/objetivos/model_metas_escrita');
const ObjetivosLeitura                         = require('../models/objetivos/model_objetivos_leitura');
const MetasLeitura                             = require('../models/objetivos/model_metas_leitura');
const { alocarSaldoEntreObjetivos }            = require('../services/objetivos_service');

const USUARIO_ID = 2;

// ─── Parâmetros do único objetivo ────────────────────────────────────────────
const PATRIMONIO = {
    descricao:    'Patrimônio',
    valor_alvo:   600,
    prazo:        9,          // abril a dezembro de 2026 (inclusive)
    pontos_total: 360,        // 40 pts/mês × 9
};

// ─── Metas customizadas ───────────────────────────────────────────────────────
// Meta 1: R$100 (compromisso inicial já cumprido)
// Metas 2–9: R$500 ÷ 8 = R$62,50 cada
const METAS = [
    { numero: 1, valorInvestir: '100.00', pontos: 40 },
    { numero: 2, valorInvestir: '62.50',  pontos: 40 },
    { numero: 3, valorInvestir: '62.50',  pontos: 40 },
    { numero: 4, valorInvestir: '62.50',  pontos: 40 },
    { numero: 5, valorInvestir: '62.50',  pontos: 40 },
    { numero: 6, valorInvestir: '62.50',  pontos: 40 },
    { numero: 7, valorInvestir: '62.50',  pontos: 40 },
    { numero: 8, valorInvestir: '62.50',  pontos: 40 },
    { numero: 9, valorInvestir: '62.50',  pontos: 40 },
];

// ─── Depósito histórico a retroalimentar ─────────────────────────────────────
const DEPOSITO_RETROATIVO = '100.00';

// ─────────────────────────────────────────────────────────────────────────────

function sep(label) {
    console.log('\n' + '─'.repeat(60));
    console.log(`  ${label}`);
    console.log('─'.repeat(60));
}

function log(msg, data) {
    if (data !== undefined) {
        console.log(`  ✔ ${msg}`, typeof data === 'object' ? JSON.stringify(data, null, 4) : data);
    } else {
        console.log(`  ✔ ${msg}`);
    }
}

async function runSQL(sql, params = []) {
    const [result] = await pool.promise().execute(sql, params);
    return result;
}

async function main() {
    console.log('\n🎯 Setup de Objetivos — Usuário', USUARIO_ID);

    // ── LIMPEZA: zerar tudo de objetivos do usuário 2 ─────────────────────────
    sep('LIMPEZA — Removendo objetivos e metas existentes do usuário 2');

    await runSQL('DELETE FROM objetivos WHERE usuario_id = ?', [USUARIO_ID]);
    await runSQL('DELETE FROM objetivos_descricao WHERE usuario_id = ?', [USUARIO_ID]);
    await runSQL(
        'UPDATE carteiras SET pontos = 0, pontos_permanentes = 0, pontos_volateis = 0 WHERE usuario_id = ?',
        [USUARIO_ID]
    );

    log('Tabelas objetivos e objetivos_descricao limpas para o usuário 2.');
    log('Pontos da carteira zerados.');

    // ── ETAPA 1: Criar o objetivo Patrimônio ──────────────────────────────────
    sep('ETAPA 1 — POST /api/v1/objetivos/2/patrimonio');
    console.log('  Body enviado:');
    console.log(JSON.stringify({
        valor_alvo:   PATRIMONIO.valor_alvo,
        prazo:        PATRIMONIO.prazo,
        pontos_total: PATRIMONIO.pontos_total,
    }, null, 4));

    let patrimonioId;
    await withTransaction(async (conn) => {
        patrimonioId = await ObjetivosEscrita.criarObjetivo({
            usuarioId:    USUARIO_ID,
            descricao:    PATRIMONIO.descricao,
            numeroTotal:  PATRIMONIO.prazo,
            valorTotal:   PATRIMONIO.valor_alvo,
            pontosTotal:  PATRIMONIO.pontos_total,
            isPatrimonio: true,
        }, conn);

        for (const meta of METAS) {
            await MetasEscrita.criarMeta({
                usuarioId:    USUARIO_ID,
                objetivoId:   patrimonioId,
                numero:       meta.numero,
                valorInvestir: meta.valorInvestir,
                pontos:       meta.pontos,
            }, conn);
        }
    });

    log(`Patrimônio criado. objetivo_id = ${patrimonioId}`);
    log('Metas criadas:');
    console.log('    Meta 1: R$100,00 (compromisso inicial)');
    console.log('    Metas 2–9: R$62,50 cada (R$500 ÷ 8 meses restantes)');
    console.log('\n  Response equivalente:');
    console.log(JSON.stringify({
        success:    true,
        message:    'Patrimônio configurado com sucesso.',
        objetivo_id: patrimonioId,
    }, null, 4));

    // ── ETAPA 2: Retroalimentar R$100 do depósito histórico ──────────────────
    sep('ETAPA 2 — Alocação retroativa do depósito de R$100');
    console.log('  (Equivalente à confirmação de depósito)');
    console.log('  POST /api/depositos/executar/2  →  body: { "amount": "100.00" }');

    await withTransaction(async (conn) => {
        await alocarSaldoEntreObjetivos(conn, USUARIO_ID, DEPOSITO_RETROATIVO);
    });

    log('Alocação retroativa concluída — R$100,00 alocado na Meta 1 (100%).');

    // ── ETAPA 3: Leitura final do estado ─────────────────────────────────────
    sep('RESULTADO FINAL — GET /api/v1/objetivos/2');

    const objetivos = await ObjetivosLeitura.buscarObjetivosAtivos(USUARIO_ID);
    const pontos    = await ObjetivosLeitura.buscarPontosCarteira(USUARIO_ID);

    for (const obj of objetivos) {
        const metas = await MetasLeitura.buscarMetasAtivas(obj.objetivo_id, 'ASC');

        const percentualGeral = metas.length > 0
            ? Math.round(metas.reduce((acc, m) => {
                const p = Number(m.objetivo_investir) > 0
                    ? Math.min(Number(m.saldo_alocado) / Number(m.objetivo_investir) * 100, 100) : 0;
                return acc + p;
              }, 0) / metas.length)
            : 0;

        console.log(`\n  Objetivo: "${obj.objetivo_descricao}" (id=${obj.objetivo_id})`);
        console.log(`    is_patrimonio:       ${Boolean(obj.is_patrimonio)}`);
        console.log(`    valor_alvo:          R$ ${Number(obj.objetivo_valor_total).toFixed(2)}`);
        console.log(`    prazo_total:         ${obj.objetivo_numero_total} meses`);
        console.log(`    saldo_alocado_total: R$ ${Number(obj.saldo_alocado_total).toFixed(2)}`);
        console.log(`    metas_completas:     ${metas.filter(m => Number(m.objetivo_completo) === 1).length}/${metas.length}`);
        console.log(`    percentual_geral:    ${percentualGeral}%`);
        console.log(`    Todas as metas:`);

        for (const m of metas) {
            const pct = Number(m.objetivo_investir) > 0
                ? Math.min(Number(m.saldo_alocado) / Number(m.objetivo_investir) * 100, 100).toFixed(1)
                : '0.0';
            const status = Number(m.objetivo_completo) === 1 ? '✔ COMPLETA' : `${pct}%`;
            console.log(`      Meta ${m.objetivo_numero}: alvo=R$${Number(m.objetivo_investir).toFixed(2)}  alocado=R$${Number(m.saldo_alocado).toFixed(2)}  (${status})`);
        }
    }

    console.log(`\n  Pontos:`);
    console.log(`    total:       ${pontos?.pontos ?? 0}`);
    console.log(`    permanentes: ${pontos?.pontos_permanentes ?? 0}`);
    console.log(`    voláteis:    ${pontos?.pontos_volateis ?? 0}`);

    console.log('\n' + '═'.repeat(60));
    console.log('  Setup concluído com sucesso.');
    console.log('═'.repeat(60) + '\n');
    process.exit(0);
}

main().catch(err => {
    console.error('\n❌ Erro:', err.message);
    console.error(err.stack);
    process.exit(1);
});
