'use strict';

// Script de correção: aloca o saldo não distribuído do usuário 2 entre os
// objetivos e recalcula os pontos.
// Uso: node scripts/corrigir_pontos_usuario2.js

const pool              = require('../database/database_purg');
const { withTransaction } = require('../database/transaction');
const { alocarSaldoEntreObjetivos, sincronizarPontosUsuario } = require('../services/objetivos_service');

const USUARIO_ID = 2;

async function run() {
    const conn0 = await pool.promise().getConnection();

    // 1. Ler carteira
    const [[carteira]] = await conn0.execute(
        'SELECT saldo, investido FROM carteiras WHERE usuario_id = ?',
        [USUARIO_ID]
    );

    // 2. Ler total já alocado nos objetivos ativos
    const [[{ total_alocado }]] = await conn0.execute(
        `SELECT COALESCE(SUM(saldo_alocado_total), 0) AS total_alocado
           FROM objetivos_descricao
          WHERE usuario_id = ? AND status_ativo = 1`,
        [USUARIO_ID]
    );

    // 3. Ler pontos atuais
    const [[pontosAtuais]] = await conn0.execute(
        'SELECT pontos, pontos_volateis, pontos_permanentes FROM carteiras WHERE usuario_id = ?',
        [USUARIO_ID]
    );

    conn0.release();

    const saldo    = Number(carteira.saldo);
    const investido = Number(carteira.investido);
    const totalCarteira = saldo + investido;
    const alocado  = Number(total_alocado);
    const gap      = totalCarteira - alocado;

    console.log('=== Estado atual ===');
    console.log(`  Carteira saldo:     R$ ${saldo.toFixed(8)}`);
    console.log(`  Carteira investido: R$ ${investido.toFixed(8)}`);
    console.log(`  Total carteira:     R$ ${totalCarteira.toFixed(8)}`);
    console.log(`  Total alocado:      R$ ${alocado.toFixed(8)}`);
    console.log(`  Gap a alocar:       R$ ${gap.toFixed(8)}`);
    console.log(`  Pontos atuais:      ${pontosAtuais.pontos} (volateis=${pontosAtuais.pontos_volateis}, permanentes=${pontosAtuais.pontos_permanentes})`);
    console.log('');

    if (gap <= 0.000001) {
        console.log('Nada a alocar — objetivos já refletem o saldo completo.');
        process.exit(0);
    }

    // 4. Alocar dentro de transação
    console.log(`Alocando R$ ${gap.toFixed(8)} entre os objetivos...`);
    await withTransaction(async (conn) => {
        await alocarSaldoEntreObjetivos(conn, USUARIO_ID, gap.toFixed(8));
    });
    console.log('Alocação concluída.');

    // 5. Sincronizar pontos
    console.log('Recalculando pontos...');
    const totalPontos = await sincronizarPontosUsuario(USUARIO_ID);
    console.log(`Pontos atualizados: ${totalPontos}`);

    // 6. Mostrar estado final
    const conn1 = await pool.promise().getConnection();

    const [[carteiraFinal]] = await conn1.execute(
        'SELECT pontos, pontos_volateis, pontos_permanentes FROM carteiras WHERE usuario_id = ?',
        [USUARIO_ID]
    );

    const [metas] = await conn1.execute(
        `SELECT d.objetivo_descricao, d.saldo_alocado_total,
                m.objetivo_numero AS meta_num, m.objetivo_investir, m.saldo_alocado,
                m.objetivo_completo, m.objetivo_pontos
           FROM objetivos_descricao d
           JOIN objetivos m ON m.objetivo_id = d.objetivo_id
          WHERE d.usuario_id = ?
          ORDER BY d.objetivo_id, m.objetivo_numero`,
        [USUARIO_ID]
    );

    conn1.release();

    console.log('\n=== Estado final ===');
    console.log(`  Pontos permanentes: ${carteiraFinal.pontos_permanentes}`);
    console.log(`  Pontos volateis:    ${carteiraFinal.pontos_volateis}`);
    console.log(`  Pontos total:       ${carteiraFinal.pontos}`);
    console.log('\n  Metas:');
    for (const m of metas) {
        const pct = m.objetivo_investir > 0
            ? (Number(m.saldo_alocado) / Number(m.objetivo_investir) * 100).toFixed(1)
            : '0.0';
        const status = Number(m.objetivo_completo) === 1 ? 'COMPLETA' : `${pct}%`;
        console.log(`    [${m.objetivo_descricao}] Meta ${m.meta_num}: R$${Number(m.saldo_alocado).toFixed(2)} / R$${Number(m.objetivo_investir).toFixed(2)} — ${status} — ${m.objetivo_pontos} pts`);
    }

    // Encerra pool manualmente
    pool.end(() => process.exit(0));
}

run().catch(err => {
    console.error('Erro:', err.message);
    pool.end(() => process.exit(1));
});
