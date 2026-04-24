const { validationResult } = require('express-validator');
const logger = require('../../logger');

// Models
const BuscarSaquePendenteModel      = require('../../models/endpoints/model_saque_buscar_saque_pendente');
const BuscarCarteiraModel           = require('../../models/endpoints/model_buscar_saldo_carteira');
const BuscarTokensCarteirasModel      = require('../../models/endpoints/model_saque_buscar_tokens');
const BuscarTokensCarteirasPurgModel  = require('../../models/endpoints/model_saque_buscar_tokens_purg');
const TransacoesPinsModel             = require('../../models/endpoints/model_saque_transacoes_pins_para_purg');
const MoverPinsModel                  = require('../../models/endpoints/model_saque_mover_pins');
const SolicitacaoSaqueModel           = require('../../models/endpoints/model_saque_registro_solicitacao');
const AtualizarCarteiraSaqueModel     = require('../../models/endpoints/model_atualizar_saldo_carteira');
const DadosCadastraisModel            = require('../../models/endpoints/model_dados_cadastrais');
const AtualizarSaqueE2eModel          = require('../../models/saques/model_saque_atualizar_e2e');

// Serviço Efí Bank — envio automático do Pix ao usuário após deduções
const { enviarPix } = require('../../services/efi_pix');

const { withTransaction } = require('../../database/transaction');

// Engine de Objetivos — dedução dentro da mesma transação do saque
const { deduzirSaldoObjetivos } = require('../../services/objetivos_service');

// Liga — sincronização de pontos/liga/ranking após commit
const { sincronizarLigaUsuario } = require('../../services/liga_service');

const SCALE   = 8;
const TEN_POW = 10n ** BigInt(SCALE);

/**
 * Utilitários de conversão para precisão arbitrária (BigInt)
 * Essencial para evitar floating point errors em transações financeiras.
 */
function decimalToBigInt(value) {
    if (value === null || value === undefined) return 0n;
    let s = typeof value === 'number' ? value.toString() : String(value);
    s = s.trim();
    if (s === '') return 0n;

    const negative = s.startsWith('-');
    if (negative) s = s.slice(1);

    const parts = s.split('.');
    const intPart  = parts[0] || '0';
    const fracPart = (parts[1] || '').slice(0, SCALE).padEnd(SCALE, '0');

    const big = BigInt(intPart) * TEN_POW + BigInt(fracPart);
    return negative ? -big : big;
}

function bigIntToDecimalString(bi) {
    const negative = bi < 0n;
    const abs = negative ? -bi : bi;
    const intPart  = abs / TEN_POW;
    const fracNum  = abs % TEN_POW;
    const fracPartFull    = fracNum.toString().padStart(SCALE, '0');
    const fracPartTrimmed = fracPartFull.replace(/0+$/, '');
    return (negative ? '-' : '') +
           (fracPartTrimmed ? `${intPart}.${fracPartTrimmed}` : `${intPart}`);
}

function truncateToDecimals(value, decimals) {
    if (value === null || value === undefined) return '0';
    let s = typeof value === 'number' ? value.toString() : String(value);
    s = s.trim();
    if (s === '') return '0';

    const negative = s.startsWith('-');
    if (negative) s = s.slice(1);

    const [intPart, fracPart = ''] = s.split('.');
    if (decimals === 0) return (negative ? '-' : '') + intPart;

    const truncated = fracPart.slice(0, decimals);
    const cleaned   = truncated.replace(/0+$/, '');
    return (negative ? '-' : '') + intPart + (cleaned ? `.${cleaned}` : '');
}

/**
 * Algoritmo de balanceamento para liquidação de ativos.
 */
function balancearVendas(tokensUsuario, totalTokensParaVender) {
    const ativos = tokensUsuario
        .filter(t => Number(t.quantidade_tokens) > 0)
        .map(t => ({
            token_id:   t.token_id,
            disponivel: Number(t.quantidade_tokens),
            qtd_vender: 0
        }));

    let restante = totalTokensParaVender;
    if (ativos.length === 0 || restante === 0) return [];

    while (restante > 0) {
        const elegiveis = ativos.filter(t => t.disponivel - t.qtd_vender > 0);
        if (elegiveis.length === 0) break;

        for (const tok of elegiveis) {
            if (restante === 0) break;
            tok.qtd_vender += 1;
            restante -= 1;
        }
    }

    return ativos.filter(t => t.qtd_vender > 0);
}

const PRECO_TOKEN_FIXO = 0.01;

const SaqueController = {
    async executeSaque(req, res) {
        const { id } = req.params;
        const { amount, chave_pix } = req.body;
        const validPixKeys = ['pix_cpf', 'pix_celular', 'pix_email', 'pix_chave'];

        // Validação de ownership: apenas o próprio usuário pode solicitar saque
        if (req.session.user.id !== parseInt(id, 10)) {
            logger.warn('Tentativa de saque não autorizado', { sessionUserId: req.session.user.id, targetId: id });
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // 1. Validação de Schema e Payload
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Falha de validação no saque', { userId: id, errors: errors.array() });
            return res.status(400).json({ errors: errors.array() });
        }

        if (amount === null || amount === undefined) {
            return res.status(400).json({ error: 'amount é obrigatório no body' });
        }

        if (!validPixKeys.includes(chave_pix)) {
            return res.status(400).json({ error: `chave_pix deve ser um dos seguintes valores: ${validPixKeys.join(', ')}` });
        }

        const amountStr = String(amount);
        const amountNum = Number(amountStr);
        if (Number.isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'amount inválido. Deve ser número > 0' });
        }

        logger.info('Iniciando processo de saque', { userId: id, amount: amountStr });

        try {
            // ETAPA 0 – Verificação de Idempotência/Estado Pendente
            // Semântica: Bloqueio de múltiplas solicitações simultâneas para garantir integridade.
            const saquesPendentes = await BuscarSaquePendenteModel.getSaquePendente(id);
            if (saquesPendentes && saquesPendentes.length > 0) {
                logger.warn('Saque bloqueado: Usuário já possui solicitação pendente', { userId: id });
                return res.status(429).json({ 
                    error: 'Você já possui uma solicitação de saque em análise. Cancele a solicitação atual, ou aguarde o processamento antes de solicitar uma nova.' 
                });
            }

            // ETAPA 1 – Verificação de Saldo (Liquidez Total)
            const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(id);
            if (!carteiraRows?.length) {
                return res.status(404).json({ error: 'Carteira não encontrada para este usuário' });
            }

            const carteira = carteiraRows[0];
            const saldoOriginal = String(carteira.saldo ?? '0');
            const investidoOriginal = String(carteira.investido ?? '0');

            const saldoTrunc = truncateToDecimals(saldoOriginal, 2);
            const investidoTrunc = truncateToDecimals(investidoOriginal, 2);

            const saldoBig = decimalToBigInt(saldoTrunc);
            const investidoBig = decimalToBigInt(investidoTrunc);
            const amountBig = decimalToBigInt(amountStr);

            const totalBig = saldoBig + investidoBig;
            if (totalBig < amountBig) {
                return res.status(409).json({
                    error: 'Saldo insuficiente',
                    totalAvailable: bigIntToDecimalString(totalBig)
                });
            }

            // ETAPA 2 – Validação de Dados Bancários/PIX
            const dadosCadastrais = await DadosCadastraisModel.getDadosCadastrais(id);
            const chavePixValue = dadosCadastrais ? dadosCadastrais[chave_pix] : null;
            if (!chavePixValue) {
                return res.status(404).json({ error: `Chave PIX (${chave_pix}) não cadastrada para o usuário.` });
            }

            // ETAPA 3 – Registro da Intenção de Saque
            let saqueId;
            try {
                const solicitacao = await SolicitacaoSaqueModel.insertSolicitacao(id, amountStr, chavePixValue);
                saqueId = solicitacao.insertId;
                logger.info(`Solicitação registrada. ID: ${saqueId}`);
            } catch (errRegister) {
                logger.error('Erro ao persistir solicitação de saque', { userId: id, err: errRegister });
                return res.status(500).json({ error: 'Erro interno ao registrar solicitação.' });
            }

            // ETAPA 4 – Cálculo de Liquidação de Tokens
            let venda_tokensBig, saldoAfterBig, investidoAfterBig;
            if (amountBig <= saldoBig) {
                venda_tokensBig = 0n;
                saldoAfterBig = saldoBig - amountBig;
                investidoAfterBig = investidoBig;
            } else {
                venda_tokensBig = amountBig - saldoBig;
                saldoAfterBig = 0n;
                investidoAfterBig = investidoBig - venda_tokensBig;
            }

            const quantidade_tokens_para_venderBig = (venda_tokensBig * 100n) / TEN_POW;
            const quantidade_tokens_para_vender = Number(quantidade_tokens_para_venderBig);

            // ETAPA 5 – Orquestração de Inventário (Tokens)
            let tokensUsuario = [];
            try {
                tokensUsuario = await BuscarTokensCarteirasModel.getTokensCarteiras(id);
            } catch (errTokens) {
                logger.error('Erro ao buscar inventário de tokens', { userId: id, err: errTokens });
                return res.status(500).json({ error: 'Erro ao processar ativos do usuário.' });
            }

            const planoVenda = balancearVendas(tokensUsuario, quantidade_tokens_para_vender);

            // Pré-leitura: busca tokens do purgatório antes de abrir a transação
            let tokensPurgatorio = [];
            try {
                tokensPurgatorio = await BuscarTokensCarteirasPurgModel.getTokensCarteiras(1);
            } catch (errPurg) {
                logger.error('Erro ao buscar tokens do purgatório', { userId: id, err: errPurg });
                return res.status(500).json({ error: 'Erro ao processar ativos do sistema.' });
            }

            // ETAPAS 6 + 7 + 8 + 9 — atômicas via transação MySQL.
            // Se qualquer passo falhar, ROLLBACK desfaz ledger, movimentação, débito e objetivos juntos.
            let novo_valor_formatted;
            let alertaObjetivos = null;
            try {
                await withTransaction(async (conn) => {
                    // ETAPA 6 – Registro de Transações (Ledger)
                    for (const venda of planoVenda) {
                        const valorTransacao = venda.qtd_vender * PRECO_TOKEN_FIXO;
                        await TransacoesPinsModel.transacoesPins(
                            id,
                            venda.token_id,
                            venda.qtd_vender,
                            valorTransacao.toFixed(2),
                            conn
                        );
                    }

                    // ETAPA 7 – Movimentação de Ativos (Usuário -> Purgatório)
                    // Pins de Emblema (EMB) são emitidos, não transferidos:
                    // ao serem vendidos, apenas zeram na carteira do usuário — nunca voltam para a Purg.
                    for (const venda of planoVenda) {
                        const tokenInfoUsuario = tokensUsuario.find(t => t.token_id === venda.token_id);
                        const novaQtdUser = Math.max(0, Number(tokenInfoUsuario?.quantidade_tokens ?? 0) - venda.qtd_vender);
                        await MoverPinsModel.removerPinsUsuario(venda.token_id, id, novaQtdUser, conn);

                        const isEMB = tokenInfoUsuario?.risco === 'EMB';
                        if (!isEMB) {
                            const tokenInfoPurg = tokensPurgatorio.find(t => t.token_id === venda.token_id);
                            const novaQtdPurg = Number(tokenInfoPurg?.quantidade_tokens ?? 0) + venda.qtd_vender;
                            await MoverPinsModel.removerPinsUsuario(venda.token_id, 1, novaQtdPurg, conn);
                        }
                    }

                    // ETAPA 8 – Finalização do Saldo da Carteira
                    // Fórmula: saldoOriginal + pin_proceeds - amount
                    // Caso simples (amount <= saldo): venda_tokensBig = 0 → saldoOriginal - amount
                    // Caso tokens: proceeds creditam o saldo, amount deduz → preserva casas decimais
                    const saldoOriginalBig = decimalToBigInt(saldoOriginal);
                    const amountBigTx      = decimalToBigInt(amountStr);
                    const novo_valor_big   = saldoOriginalBig + venda_tokensBig - amountBigTx;
                    novo_valor_formatted   = bigIntToDecimalString(novo_valor_big);
                    await AtualizarCarteiraSaqueModel.updateCarteira(novo_valor_formatted, id, conn);

                    // ETAPA 9 – Dedução virtual nos objetivos (LIFO + proteção Patrimônio)
                    // Participa da mesma transação: rollback desfaz tudo se falhar.
                    const resultadoObjetivos = await deduzirSaldoObjetivos(conn, parseInt(id, 10), amountStr);
                    if (resultadoObjetivos?.alerta) {
                        alertaObjetivos = resultadoObjetivos.alerta;
                        logger.warn('[Saque] Alerta de viabilidade de objetivos', { userId: id, alerta: alertaObjetivos });
                    }
                });
            } catch (errTx) {
                logger.error('Erro na transação de débito/tokens — rollback executado', { userId: id, err: errTx });
                return res.status(500).json({ error: 'Erro ao processar débito do saque. Nenhuma alteração foi salva.' });
            }

            // Atualiza pontos, liga e ranking em background após commit
            setImmediate(async () => {
                try {
                    await sincronizarLigaUsuario(parseInt(id, 10));
                    logger.info('[Saque] Liga/pontos sincronizados pós-saque.', { userId: id });
                } catch (errLiga) {
                    logger.error('[Saque] Erro ao sincronizar liga pós-saque.', { userId: id, erro: errLiga.message });
                }
            });

            // ETAPA 9 – Envio automático do Pix via Efí Bank
            // Semântica: disparado imediatamente após todas as deduções.
            // Se falhar, o saque permanece "Processando" e o admin pode reprocessar
            // manualmente via POST /api/saques/executar/:id (retry).

            // Chave celular exige prefixo internacional +55 (padrão Bacen)
            let chaveParaEnvio = chavePixValue;
            if (chave_pix === 'pix_celular' && !chaveParaEnvio.startsWith('+')) {
                chaveParaEnvio = '+55' + chaveParaEnvio.replace(/\D/g, '');
            }

            let endToEndId = null;
            try {
                const pixEnviado = await enviarPix({
                    chaveDestino: chaveParaEnvio,
                    valor:        Number(amountStr).toFixed(2),
                    descricao:    `Saque Purg #${saqueId}`
                });
                endToEndId = pixEnviado.endToEndId;
                await AtualizarSaqueE2eModel.atualizarE2e(saqueId, endToEndId);
                logger.info('Pix de saque enviado automaticamente', { userId: id, saqueId, endToEndId });
            } catch (errPix) {
                // Deduções já realizadas — saque fica "Processando" para reprocessamento pelo admin
                logger.error('Falha no envio automático do Pix — saque requer reprocessamento manual', {
                    userId: id, saqueId, erro: errPix.message
                });
            }

            // Resposta de Sucesso
            const response = {
                message: endToEndId
                    ? 'Saque processado e Pix enviado com sucesso.'
                    : 'Saque processado. O envio do Pix será concluído em breve.',
                details: {
                    valor_solicitado:     amountStr,
                    saldo_anterior:       saldoTrunc,
                    novo_saldo:           novo_valor_formatted,
                    tokens_vendidos:      quantidade_tokens_para_vender,
                    valor_investido_antes:  investidoTrunc,
                    valor_investido_depois: bigIntToDecimalString(investidoAfterBig),
                    chave_pix:            chavePixValue,
                    ...(endToEndId && { end_to_end_id: endToEndId, status_pix: 'Processando' }),
                    ...(alertaObjetivos && { alerta_objetivos: alertaObjetivos })
                }
            };

            logger.info('Saque finalizado com sucesso', { userId: id, saqueId });
            return res.status(200).json(response);

        } catch (err) {
            logger.error('Erro não tratado no fluxo de saque', { userId: id, err });
            return res.status(500).json({ error: 'Erro interno ao processar saque.' });
        }
    }
};

module.exports = SaqueController;
