// services/objetivos_service.js
//
// Engine central de Objetivos, Metas e Pontuação da Purg.
//
// Expõe três funções públicas:
//
//   alocarSaldoEntreObjetivos(conn, usuarioId, valorNovo)
//     → Chamada após depósito confirmado ou pagamento de rendimento.
//       Distribui o valor igualitariamente entre os objetivos ativos do usuário,
//       preenchendo as metas em ordem cronológica (FIFO).
//
//   deduzirSaldoObjetivos(conn, usuarioId, valorDeduzido)
//     → Chamada DENTRO do withTransaction do saque.
//       Remove saldo virtual respeitando a hierarquia:
//       1. Objetivos secundários primeiro (LIFO nas metas)
//       2. Patrimônio por último (LIFO nas metas)
//       Cancela automaticamente objetivos secundários zerados.
//       Retorna alerta de viabilidade se aplicável.
//
//   gerarMetas(valorAlvo, prazo, pontosTotal)
//     → Utilitário que gera o array de metas a partir dos parâmetros do objetivo.

'use strict';

const logger = require('../logger');
const ObjetivosLeitura = require('../models/objetivos/model_objetivos_leitura');
const ObjetivosEscrita = require('../models/objetivos/model_objetivos_escrita');
const MetasLeitura     = require('../models/objetivos/model_metas_leitura');
const MetasEscrita     = require('../models/objetivos/model_metas_escrita');
const NotificacoesModel = require('../models/webhook/model_notificacoes');

// ---------------------------------------------------------------------------
// Utilitários BigInt (precisão de 8 casas decimais — padrão do projeto)
// ---------------------------------------------------------------------------
const SCALE   = 8;
const TEN_POW = 10n ** BigInt(SCALE);

function decimalToBigInt(value) {
    if (value === null || value === undefined) return 0n;
    let s = typeof value === 'number' ? value.toFixed(SCALE) : String(value).trim();
    if (!s || s === 'null' || s === 'undefined') return 0n;
    const negative = s.startsWith('-');
    if (negative) s = s.slice(1);
    const [intPart, fracPart = ''] = s.split('.');
    const big = BigInt(intPart || '0') * TEN_POW
              + BigInt(fracPart.slice(0, SCALE).padEnd(SCALE, '0'));
    return negative ? -big : big;
}

function bigIntToDecimalString(bi) {
    const negative = bi < 0n;
    const abs      = negative ? -bi : bi;
    const intPart  = abs / TEN_POW;
    const fracNum  = abs % TEN_POW;
    const fracPart = fracNum.toString().padStart(SCALE, '0').replace(/0+$/, '');
    return (negative ? '-' : '') + (fracPart ? `${intPart}.${fracPart}` : `${intPart}`);
}

// ---------------------------------------------------------------------------
// Privado: resetar metas (trava_inicial)
// ---------------------------------------------------------------------------
async function _resetarMetasObjetivo(conn, objetivo, usuarioId) {
    await MetasEscrita.resetarSaldoMetasObjetivo(objetivo.objetivo_id, conn);
    await ObjetivosEscrita.atualizarSaldoTotal(objetivo.objetivo_id, '0', conn);
    await ObjetivosEscrita.registrarRecalculo({
        usuarioId,
        objetivoId:   objetivo.objetivo_id,
        motivo:       'trava_inicial',
        saldoNaData:  String(objetivo.saldo_alocado_total),
    }, conn);
    logger.warn(`[ObjetivosService] Trava inicial ativada — objetivo ${objetivo.objetivo_id} resetado.`);
}

// ---------------------------------------------------------------------------
// Privado: atualizar pontos_volateis na carteira
// ---------------------------------------------------------------------------
async function _atualizarPontosVolateis(conn, usuarioId) {
    const objetivos = await ObjetivosLeitura.buscarObjetivosAtivos(usuarioId, conn);
    let pontosVolateis = 0;

    for (const objetivo of objetivos) {
        const metas = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'ASC', conn);
        for (const meta of metas) {
            if (Number(meta.objetivo_completo) === 1) continue; // metas completas → pontos permanentes
            const investir = Number(meta.objetivo_investir);
            if (investir <= 0) continue;
            const percentual = Math.min(Number(meta.saldo_alocado) / investir * 100, 100);
            pontosVolateis += Math.floor(Number(meta.objetivo_pontos) * percentual / 100);
        }
    }

    await ObjetivosEscrita.atualizarPontosVolateis(usuarioId, pontosVolateis, conn);
}

// ---------------------------------------------------------------------------
// Privado: concluir objetivo (pontos já foram concedidos meta a meta)
// ---------------------------------------------------------------------------
async function _concluirObjetivo(conn, usuarioId, objetivo) {
    await ObjetivosEscrita.concluirObjetivo(objetivo.objetivo_id, conn);
    logger.info(`[ObjetivosService] Objetivo ${objetivo.objetivo_id} (${objetivo.objetivo_descricao}) concluído.`);
    setImmediate(async () => {
        try {
            const [metas, investido] = await Promise.all([
                MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id),
                ObjetivosLeitura.buscarInvestido(usuarioId),
            ]);
            const metas_concluidas = metas.filter(m => Number(m.objetivo_completo) === 1).length;
            const metas_restantes  = metas.filter(m => Number(m.objetivo_completo) === 0).length;
            const metas_totais     = metas_concluidas + metas_restantes;
            const valorTotal       = Number(objetivo.objetivo_valor_total);
            const investidoNum     = Number(investido);
            const percentual_atingido = valorTotal > 0
                ? parseFloat(((investidoNum / valorTotal) * 100).toFixed(2))
                : 0;

            await NotificacoesModel.criar(usuarioId, 'meta_atingida', {
                objetivo_id:          objetivo.objetivo_id,
                objetivo_nome:        objetivo.objetivo_descricao,
                objetivo_valor_total: valorTotal,
                metas_totais,
                metas_concluidas,
                metas_restantes,
                investido:            parseFloat(investidoNum.toFixed(2)),
                percentual_atingido,
            });
        } catch (err) {
            logger.error('[Nami] Falha ao enfileirar notificação de meta atingida', { usuarioId, erro: err.message });
        }
    });
}

// ---------------------------------------------------------------------------
// Privado: alocar um valor numa lista de metas (FIFO, ASC)
// Retorna BigInt com o que NÃO foi alocado (sobra).
// concederPontos=false é usado no recálculo para evitar dupla contagem.
// ---------------------------------------------------------------------------
async function _alocarNasMetas(conn, metas, valorBig, usuarioId, concederPontos = true) {
    let restante = valorBig;

    for (const meta of metas) {
        if (restante <= 0n) break;

        const saldoAtualBig = decimalToBigInt(String(meta.saldo_alocado));
        const alvoMetaBig   = decimalToBigInt(String(meta.objetivo_investir));
        const espaco        = alvoMetaBig - saldoAtualBig;

        if (espaco <= 0n) continue; // meta já cheia

        const adicionar  = restante < espaco ? restante : espaco;
        const novoSaldo  = bigIntToDecimalString(saldoAtualBig + adicionar);

        await MetasEscrita.atualizarSaldoMeta(meta.id, novoSaldo, conn);

        if (saldoAtualBig + adicionar >= alvoMetaBig) {
            await MetasEscrita.concluirMeta(meta.id, conn);
            if (concederPontos) {
                const pontosMeta = Number(meta.objetivo_pontos);
                if (pontosMeta > 0) {
                    await ObjetivosEscrita.adicionarPontosPermanentes(usuarioId, pontosMeta, conn);
                }
            }
        }

        restante -= adicionar;
    }

    return restante; // valor não alocado
}

// ---------------------------------------------------------------------------
// Privado: deduzir um valor numa lista de metas (LIFO, DESC)
// Retorna BigInt com o que NÃO foi deduzido (sobra).
// ---------------------------------------------------------------------------
async function _deduzirNasMetas(conn, metas, valorBig) {
    let restante = valorBig;

    for (const meta of metas) {
        if (restante <= 0n) break;

        const saldoBig = decimalToBigInt(String(meta.saldo_alocado));
        if (saldoBig <= 0n) continue;

        const deduzir   = restante < saldoBig ? restante : saldoBig;
        const novoSaldo = bigIntToDecimalString(saldoBig - deduzir);

        await MetasEscrita.atualizarSaldoMeta(meta.id, novoSaldo, conn);

        // Reabrir meta se o novo saldo ficou abaixo do alvo (independente do estado em memória)
        if (saldoBig - deduzir < decimalToBigInt(String(meta.objetivo_investir))) {
            await MetasEscrita.reabrirMeta(meta.id, conn);
        }

        restante -= deduzir;
    }

    return restante; // valor não deduzido (zerou o objetivo antes)
}

// ===========================================================================
// PÚBLICO 1: Alocar saldo entre objetivos
// ===========================================================================
/**
 * Distribui um valor novo entre os objetivos ativos do usuário.
 * Chamado após: confirmação de depósito (webhook + execução manual) e rendimentos.
 *
 * @param {import('mysql2/promise').PoolConnection} conn - Conexão de transação aberta
 * @param {number} usuarioId
 * @param {string|number} valorNovo - Valor a distribuir (string ou number, ex: "125.50")
 */
async function alocarSaldoEntreObjetivos(conn, usuarioId, valorNovo) {
    const valorBig = decimalToBigInt(String(valorNovo));
    if (valorBig <= 0n) return;

    const objetivos = await ObjetivosLeitura.buscarObjetivosAtivos(usuarioId, conn);
    if (!objetivos.length) {
        logger.warn(`[ObjetivosService] Usuário ${usuarioId} sem objetivos ativos — alocação ignorada.`);
        return;
    }

    const N = BigInt(objetivos.length);
    const partePorObjetivo = valorBig / N;
    const resto            = valorBig % N; // distribui um wei extra aos primeiros `resto` objetivos

    for (let i = 0; i < objetivos.length; i++) {
        const objetivo = objetivos[i];
        // +1 nos primeiros `resto` objetivos para não perder frações
        const parteI = partePorObjetivo + (BigInt(i) < resto ? 1n : 0n);
        if (parteI <= 0n) continue;

        const metas = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'ASC', conn);
        if (!metas.length) {
            logger.warn(`[ObjetivosService] Objetivo ${objetivo.objetivo_id} sem metas — alocação ignorada.`);
            continue;
        }

        // --- Trava Inicial (apenas no primeiro aporte de cada objetivo) ---
        if (!objetivo.primeiro_aporte_feito) {
            const meta1        = metas[0];
            const meta1Big     = decimalToBigInt(String(meta1.objetivo_investir));
            const valorAlvoBig = decimalToBigInt(String(objetivo.objetivo_valor_total));
            // Threshold: valor_meta_1 + 30% do valor_alvo total
            const threshold    = meta1Big + (valorAlvoBig * 30n / 100n);

            if (parteI > threshold) {
                await _resetarMetasObjetivo(conn, objetivo, usuarioId);
                // Não aloca nada neste objetivo neste ciclo — usuário deve reconfigurar
                continue;
            }

            await ObjetivosEscrita.marcarPrimeiroAporte(objetivo.objetivo_id, conn);
        }

        // --- Alocação FIFO nas metas ---
        const sobra = await _alocarNasMetas(conn, metas, parteI, usuarioId);
        const valorAlocado = parteI - sobra;

        // Atualizar saldo_alocado_total
        const novoTotal = bigIntToDecimalString(
            decimalToBigInt(String(objetivo.saldo_alocado_total)) + valorAlocado
        );
        await ObjetivosEscrita.atualizarSaldoTotal(objetivo.objetivo_id, novoTotal, conn);

        // Verificar se todas as metas foram completadas
        const metasAtualizadas = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'ASC', conn);
        const todasCompletas   = metasAtualizadas.length > 0
            && metasAtualizadas.every(m => Number(m.objetivo_completo) === 1);
        if (todasCompletas) {
            await _concluirObjetivo(conn, usuarioId, objetivo);
        }
    }

    // Recalcular pontos_volateis após todas as alocações
    await _atualizarPontosVolateis(conn, usuarioId);
}

// ===========================================================================
// PÚBLICO 2: Deduzir saldo dos objetivos (saque)
// ===========================================================================
/**
 * Remove saldo virtual dos objetivos seguindo a hierarquia de proteção:
 *   1. Objetivos secundários (LIFO nas metas de cada um)
 *   2. Objetivo Patrimônio por último (LIFO nas metas)
 *
 * Cancela automaticamente objetivos secundários zerados.
 * Deve ser chamado DENTRO de um withTransaction existente.
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {number} usuarioId
 * @param {string|number} valorDeduzido
 * @returns {{ alerta: string|null }} Alerta de viabilidade, ou null
 */
async function deduzirSaldoObjetivos(conn, usuarioId, valorDeduzido) {
    let restante = decimalToBigInt(String(valorDeduzido));
    if (restante <= 0n) return { alerta: null };

    // --- Etapa 1: Deduzir dos objetivos secundários ---
    const secundarios = await ObjetivosLeitura.buscarObjetivosSecundarios(usuarioId, conn);

    for (const objetivo of secundarios) {
        if (restante <= 0n) break;

        const metas          = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'DESC', conn);
        const saldoAntesBig  = decimalToBigInt(String(objetivo.saldo_alocado_total));
        const sobraApos      = await _deduzirNasMetas(conn, metas, restante);
        const deduzido       = restante - sobraApos;

        if (deduzido > 0n) {
            const novoTotal = bigIntToDecimalString(saldoAntesBig - deduzido);
            await ObjetivosEscrita.atualizarSaldoTotal(objetivo.objetivo_id, novoTotal, conn);

            // Cancelar automaticamente se zerou
            if (saldoAntesBig - deduzido <= 0n) {
                await ObjetivosEscrita.cancelarObjetivo(objetivo.objetivo_id, conn);
                logger.info(`[ObjetivosService] Objetivo secundário ${objetivo.objetivo_id} zerado e cancelado.`);
            }
        }

        restante = sobraApos;
    }

    // --- Etapa 2: Deduzir do Patrimônio (proteção — último recurso) ---
    if (restante > 0n) {
        const patrimonio = await ObjetivosLeitura.buscarPatrimonio(usuarioId, conn);
        if (patrimonio) {
            const metas         = await MetasLeitura.buscarMetasAtivas(patrimonio.objetivo_id, 'DESC', conn);
            const saldoAntesBig = decimalToBigInt(String(patrimonio.saldo_alocado_total));
            const sobraApos     = await _deduzirNasMetas(conn, metas, restante);
            const deduzido      = restante - sobraApos;

            if (deduzido > 0n) {
                const novoTotal = bigIntToDecimalString(saldoAntesBig - deduzido);
                await ObjetivosEscrita.atualizarSaldoTotal(patrimonio.objetivo_id, novoTotal, conn);
            }

            restante = sobraApos;
        }
    }

    if (restante > 0n) {
        // Saldo virtual esgotado antes de cobrir o valor total do saque
        // Isso é esperado se o usuário não tinha saldo virtual suficiente alocado
        logger.warn(`[ObjetivosService] Saldo virtual insuficiente para cobrir dedução completa. Usuário ${usuarioId}.`);
    }

    // Recalcular pontos_volateis
    await _atualizarPontosVolateis(conn, usuarioId);

    // Verificar viabilidade
    return _verificarViabilidade(usuarioId, conn);
}

// ---------------------------------------------------------------------------
// Privado: verificar viabilidade das metas restantes
// ---------------------------------------------------------------------------
async function _verificarViabilidade(usuarioId, conn) {
    const objetivos = await ObjetivosLeitura.buscarObjetivosAtivos(usuarioId, conn);

    for (const objetivo of objetivos) {
        const metas = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'ASC', conn);
        const metasIncompletas = metas.filter(m => Number(m.objetivo_completo) === 0);
        if (!metasIncompletas.length) continue;

        // Soma do que ainda falta nas metas incompletas
        let faltaTotal = 0n;
        for (const meta of metasIncompletas) {
            faltaTotal += decimalToBigInt(String(meta.objetivo_investir))
                        - decimalToBigInt(String(meta.saldo_alocado));
        }

        // Aporte médio necessário por meta restante
        const aporteMedioNecessario = faltaTotal / BigInt(metasIncompletas.length);

        // Aporte médio original (valor_alvo / prazo)
        const numTotal = Number(objetivo.objetivo_numero_total);
        if (numTotal <= 0) continue;
        const aporteMedioOriginal = decimalToBigInt(String(objetivo.objetivo_valor_total)) / BigInt(numTotal);

        // Se o necessário for mais de 20% acima do original → alerta
        if (aporteMedioNecessario > aporteMedioOriginal + (aporteMedioOriginal * 20n / 100n)) {
            return {
                alerta: `O objetivo "${objetivo.objetivo_descricao}" requer recálculo: ` +
                        `o aporte necessário por meta (R$ ${bigIntToDecimalString(aporteMedioNecessario)}) ` +
                        `está acima do planejado (R$ ${bigIntToDecimalString(aporteMedioOriginal)}).`
            };
        }
    }

    return { alerta: null };
}

// ===========================================================================
// PÚBLICO 3: Recalcular metas de um objetivo (edição de valor_alvo ou prazo)
// ===========================================================================

/**
 * Gera metas para o RESTANTE de um objetivo em edição.
 * Diferente de gerarMetas(), parte de um numeroInicio e distribui apenas
 * o valor restante (não o valor_alvo total).
 */
function gerarMetasRestantes(restante, prazo, pontosTotal, numeroInicio, dataInicio = new Date()) {
    if (prazo <= 0) throw new Error('Prazo deve ser maior que zero.');

    const anoInicio = dataInicio.getFullYear();
    const mesInicio = dataInicio.getMonth();
    const metas     = [];

    const valorCentsTotal = Math.round(restante * 100);
    const valorPorMeta    = Math.floor(valorCentsTotal / prazo);
    const restoValor      = valorCentsTotal - valorPorMeta * prazo;

    const pontosPorMeta = Math.floor(pontosTotal / prazo);
    const restoPontos   = pontosTotal - pontosPorMeta * prazo;

    for (let i = 0; i < prazo; i++) {
        const isUltima  = i === prazo - 1;
        const mesOffset = mesInicio + i;
        const ano       = anoInicio + Math.floor(mesOffset / 12);
        const mes       = mesOffset % 12;
        metas.push({
            numero:        numeroInicio + i,
            valorInvestir: ((valorPorMeta + (isUltima ? restoValor : 0)) / 100).toFixed(2),
            pontos:        pontosPorMeta + (i < restoPontos ? 1 : 0),
            dataLimite:    _ultimoDiaMes(ano, mes),
        });
    }

    return metas;
}

/**
 * Recalcula as metas de um objetivo preservando as já concluídas.
 *
 * Lógica:
 *   - Metas concluídas → intocáveis (pontuação já garantida)
 *   - Metas incompletas → canceladas e recriadas com base no RESTANTE
 *   - Restante = novoValorAlvo - saldo_alocado_total
 *   - Saldo pendente (das metas incompletas canceladas) → realocado FIFO
 *     nas novas metas com concessão de pontos (cascata silenciosa)
 *   - saldo_alocado_total não é alterado (dinheiro já estava lá)
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {number} usuarioId
 * @param {object} objetivo   - Registro atual de objetivos_descricao
 * @param {number} novoValorAlvo
 * @param {number} novoPrazo  - Número de NOVAS metas a criar (meses restantes)
 * @param {number} novosPontosTotal
 * @param {string} motivo     - 'alteracao_alvo' | 'alteracao_prazo'
 */
async function recalcularMetasObjetivo(conn, usuarioId, objetivo, novoValorAlvo, novoPrazo, novosPontosTotal, motivo) {
    const saldoAtualBig = decimalToBigInt(String(objetivo.saldo_alocado_total));
    const novoValorBig  = decimalToBigInt(String(novoValorAlvo));
    const PARCELA_MIN   = decimalToBigInt('5');

    // Ler metas ativas em ordem crescente
    const metas       = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'ASC', conn);
    const completadas = metas.filter(m => Number(m.objetivo_completo) === 1);
    const incompletas = metas.filter(m => Number(m.objetivo_completo) !== 1);

    // ---------------------------------------------------------------------------
    // Determinar baseline e estratégia de cancelamento
    //
    // Caso A — saldo > 0: dinheiro foi investido.
    //   baseline = saldo_alocado_total (o que o usuário realmente já colocou)
    //   cancela todas as metas incompletas e recomeça a partir daí
    //
    // Caso B — saldo = 0: nenhum depósito feito ainda.
    //   baseline = objetivo_investir da primeira meta (o aporte comprometido)
    //   preserva a primeira meta intacta; cancela e recria apenas as seguintes
    // ---------------------------------------------------------------------------
    let baselineBig;
    let saldoPendenteBig = 0n;
    let numeroInicio;

    // Resgatar saldo de metas já inativas (resíduo de recálculos anteriores) e zerá-las
    const todasAsMetas = await MetasLeitura.buscarTodasMetas(objetivo.objetivo_id, conn);
    for (const meta of todasAsMetas) {
        const saldoInativoBig = decimalToBigInt(String(meta.saldo_alocado));
        if (Number(meta.status_ativo) === 0 && saldoInativoBig > 0n) {
            saldoPendenteBig += saldoInativoBig;
            await MetasEscrita.atualizarSaldoMeta(meta.id, '0', conn);
        }
    }

    if (saldoAtualBig > 0n) {
        baselineBig = saldoAtualBig;

        for (const meta of incompletas) {
            saldoPendenteBig += decimalToBigInt(String(meta.saldo_alocado));
        }

        const maxNumero = completadas.length > 0
            ? Math.max(...completadas.map(m => Number(m.objetivo_numero)))
            : 0;
        numeroInicio = maxNumero + 1;

        await MetasEscrita.cancelarMetasIncompletas(objetivo.objetivo_id, conn);

    } else {
        const primeiraMeta = metas[0];

        if (primeiraMeta) {
            baselineBig  = decimalToBigInt(String(primeiraMeta.objetivo_investir));
            numeroInicio = 2;
            await MetasEscrita.cancelarMetasAPartirDeNumero(objetivo.objetivo_id, 1, conn);
        } else {
            baselineBig  = 0n;
            numeroInicio = 1;
            await MetasEscrita.cancelarMetasIncompletas(objetivo.objetivo_id, conn);
        }
    }

    const restanteBig = novoValorBig - baselineBig;

    // Validações (lançam erro marcado para o controller devolver 400)
    if (restanteBig <= 0n) {
        const err = new Error(`O valor alvo deve ser maior que o valor base já comprometido (R$ ${bigIntToDecimalString(baselineBig)}).`);
        err.validationError = true;
        throw err;
    }
    const parcelaBig = restanteBig / BigInt(novoPrazo);
    if (parcelaBig < PARCELA_MIN) {
        const err = new Error(`A parcela mínima é de R$ 5,00. Com ${novoPrazo} meses restantes, cada parcela seria R$ ${bigIntToDecimalString(parcelaBig)}.`);
        err.validationError = true;
        throw err;
    }

    // Pontos já ganhos nas concluídas → restantes redistribuídos nas novas metas
    const pontosJaGanhos  = completadas.reduce((sum, m) => sum + Number(m.objetivo_pontos), 0);
    const pontosRestantes = Math.max(0, Number(novosPontosTotal) - pontosJaGanhos);

    // Registrar recálculo
    await ObjetivosEscrita.registrarRecalculo({
        usuarioId,
        objetivoId:  objetivo.objetivo_id,
        motivo,
        saldoNaData: String(objetivo.saldo_alocado_total),
    }, conn);

    // Atualizar cabeçalho do objetivo
    await ObjetivosEscrita.editarObjetivo({
        objetivoId:   objetivo.objetivo_id,
        descricao:    objetivo.objetivo_descricao,
        valorTotal:   novoValorAlvo,
        numeroTotal:  completadas.length + novoPrazo,
        pontosTotal:  Number(novosPontosTotal),
    }, conn);

    // Gerar e inserir novas metas para o restante
    const restanteNum = Number(bigIntToDecimalString(restanteBig));
    const novasMetas  = gerarMetasRestantes(restanteNum, novoPrazo, pontosRestantes, numeroInicio);
    for (const meta of novasMetas) {
        await MetasEscrita.criarMeta({
            usuarioId,
            objetivoId:    objetivo.objetivo_id,
            numero:        meta.numero,
            valorInvestir: meta.valorInvestir,
            pontos:        meta.pontos,
            dataLimite:    meta.dataLimite,
        }, conn);
    }

    // Realocar saldo pendente nas novas metas (FIFO, com pontos — cascata silenciosa)
    if (saldoPendenteBig > 0n) {
        const metasAtualizadas = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'ASC', conn);
        const novasIncompletas = metasAtualizadas.filter(m => Number(m.objetivo_completo) !== 1);
        await _alocarNasMetas(conn, novasIncompletas, saldoPendenteBig, usuarioId, true);
    }

    // Verificar conclusão total (cascata pode ter completado tudo)
    const metasFinais    = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'ASC', conn);
    const todasCompletas = metasFinais.length > 0 && metasFinais.every(m => Number(m.objetivo_completo) === 1);
    if (todasCompletas) {
        await _concluirObjetivo(conn, usuarioId, { ...objetivo, objetivo_pontos_total: novosPontosTotal });
    }

    // Garantir que trava_inicial não re-dispara no próximo depósito
    await ObjetivosEscrita.marcarPrimeiroAporte(objetivo.objetivo_id, conn);

    await _atualizarPontosVolateis(conn, usuarioId);

    logger.info(`[ObjetivosService] Recálculo concluído. objetivo=${objetivo.objetivo_id}, motivo=${motivo}, baseline=${bigIntToDecimalString(baselineBig)}, restante=${bigIntToDecimalString(restanteBig)}, novoPrazo=${novoPrazo}.`);
}

// ===========================================================================
// PÚBLICO 4: Utilitário de geração de metas
// ===========================================================================
/**
 * Retorna o último dia do mês como string YYYY-MM-DD.
 */
function _ultimoDiaMes(year, month) {
    // new Date(year, month+1, 0) = último dia do mês (month é 0-indexed)
    const d = new Date(year, month + 1, 0);
    return d.toISOString().slice(0, 10);
}

/**
 * Gera o array de metas a partir dos parâmetros do objetivo.
 *
 * Sem aporte_inicial: distribui valor_alvo igualitariamente entre `prazo` metas.
 * Com aporte_inicial: meta 1 = aporte_inicial; metas 2..(prazo+1) = (valor_alvo - aporte_inicial) / prazo.
 * O restante fracional sempre vai para a última meta.
 * Cada meta recebe data_limite = último dia do mês correspondente.
 *
 * @param {number} valorAlvo      - Valor total do objetivo (ex: 5000)
 * @param {number} prazo          - Meses igualitários (sem aporte_inicial: total; com: após o inicial)
 * @param {number} pontosTotal    - Total de pontos do objetivo
 * @param {number} aporteInicial  - Valor da primeira parcela diferenciada (0 = desativado)
 * @param {Date}   dataInicio     - Mês de início (padrão: mês atual)
 * @returns {{ numero, valorInvestir, pontos, dataLimite }[]}
 */
function gerarMetas(valorAlvo, prazo, pontosTotal, aporteInicial = 0, dataInicio = new Date()) {
    if (prazo <= 0) throw new Error('Prazo deve ser maior que zero.');

    const anoInicio = dataInicio.getFullYear();
    const mesInicio = dataInicio.getMonth(); // 0-indexed
    const metas     = [];

    if (aporteInicial > 0) {
        // Meta 1 = aporte_inicial; metas 2..(prazo+1) distribuídas igualitariamente
        const totalMetas           = prazo + 1;
        const valorRestanteCents   = Math.round((valorAlvo - aporteInicial) * 100);
        const valorPorMetaRestante = Math.floor(valorRestanteCents / prazo);
        const restoValorRestante   = valorRestanteCents - valorPorMetaRestante * prazo;

        const pontosAporte     = Math.floor(pontosTotal / totalMetas);
        const pontosRestantes  = pontosTotal - pontosAporte;
        const pontosPorMeta    = Math.floor(pontosRestantes / prazo);
        const restoPontos      = pontosRestantes - pontosPorMeta * prazo;

        metas.push({
            numero:        1,
            valorInvestir: aporteInicial.toFixed(2),
            pontos:        pontosAporte,
            dataLimite:    _ultimoDiaMes(anoInicio, mesInicio),
        });

        for (let i = 2; i <= totalMetas; i++) {
            const idx       = i - 2; // 0-based entre as metas regulares
            const isUltima  = i === totalMetas;
            const mesOffset = mesInicio + (i - 1);
            const ano       = anoInicio + Math.floor(mesOffset / 12);
            const mes       = mesOffset % 12;
            metas.push({
                numero:        i,
                valorInvestir: ((valorPorMetaRestante + (isUltima ? restoValorRestante : 0)) / 100).toFixed(2),
                pontos:        pontosPorMeta + (idx < restoPontos ? 1 : 0),
                dataLimite:    _ultimoDiaMes(ano, mes),
            });
        }
    } else {
        const valorCentsTotal = Math.round(valorAlvo * 100);
        const valorPorMeta    = Math.floor(valorCentsTotal / prazo);
        const restoValor      = valorCentsTotal - valorPorMeta * prazo;

        const pontosPorMeta = Math.floor(pontosTotal / prazo);
        const restoPontos   = pontosTotal - pontosPorMeta * prazo;

        for (let i = 1; i <= prazo; i++) {
            const isUltima  = i === prazo;
            const mesOffset = mesInicio + (i - 1);
            const ano       = anoInicio + Math.floor(mesOffset / 12);
            const mes       = mesOffset % 12;
            metas.push({
                numero:        i,
                valorInvestir: ((valorPorMeta + (isUltima ? restoValor : 0)) / 100).toFixed(2),
                pontos:        pontosPorMeta + (i - 1 < restoPontos ? 1 : 0),
                dataLimite:    _ultimoDiaMes(ano, mes),
            });
        }
    }

    return metas;
}

// ===========================================================================
// PÚBLICO 5: Sincronizar pontos de um usuário (sem transação)
// ===========================================================================
/**
 * Recalcula pontos_volateis com base no estado atual das metas,
 * atualiza carteiras.pontos_volateis e carteiras.pontos,
 * e retorna o total de pontos atualizado.
 *
 * Chamado pela rotina de manutenção de liga para garantir que
 * carteiras.pontos reflita fielmente o progresso real das metas.
 *
 * @param {number} usuarioId
 * @returns {Promise<number>} Total de pontos atualizados (pontos_permanentes + pontos_volateis)
 */
async function sincronizarPontosUsuario(usuarioId) {
    // Lê pontos_permanentes e pontos_indicacao antes de atualizar (não mudam nesta função)
    const rowAntes = await ObjetivosLeitura.buscarPontosCarteira(usuarioId);
    const permanentes = rowAntes ? Number(rowAntes.pontos_permanentes) : 0;
    const indicacao   = rowAntes ? Number(rowAntes.pontos_indicacao)   : 0;

    // Recalcula pontos_volateis com base no progresso atual das metas
    const objetivos = await ObjetivosLeitura.buscarObjetivosAtivos(usuarioId);
    let pontosVolateis = 0;

    for (const objetivo of objetivos) {
        const metas = await MetasLeitura.buscarMetasAtivas(objetivo.objetivo_id, 'ASC');
        for (const meta of metas) {
            if (Number(meta.objetivo_completo) === 1) continue;
            const investir = Number(meta.objetivo_investir);
            if (investir <= 0) continue;
            const percentual = Math.min(Number(meta.saldo_alocado) / investir * 100, 100);
            pontosVolateis += Math.floor(Number(meta.objetivo_pontos) * percentual / 100);
        }
    }

    // Persiste os valores recalculados (atualizarPontosVolateis já inclui pontos_indicacao no total)
    await ObjetivosEscrita.atualizarPontosVolateis(usuarioId, pontosVolateis);

    return permanentes + pontosVolateis + indicacao;
}

module.exports = {
    alocarSaldoEntreObjetivos,
    deduzirSaldoObjetivos,
    recalcularMetasObjetivo,
    gerarMetas,
    sincronizarPontosUsuario,
};
