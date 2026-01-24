const { validationResult } = require('express-validator');
const logger = require('../../logger');

// Models
const BuscarSaquePendenteModel      = require('../../models/endpoints/model_saque_buscar_saque_pendente');
const BuscarCarteiraModel           = require('../../models/endpoints/model_saque_buscar_carteira');
const BuscarTokensCarteirasModel      = require('../../models/endpoints/model_saque_buscar_tokens');
const BuscarTokensCarteirasPurgModel  = require('../../models/endpoints/model_saque_buscar_tokens_purg');
const TransacoesPinsModel             = require('../../models/endpoints/model_saque_transacoes_pins_para_purg');
const MoverPinsModel                  = require('../../models/endpoints/model_saque_mover_pins');
const SolicitacaoSaqueModel           = require('../../models/endpoints/model_saque_registro_solicitacao');
const AtualizarCarteiraSaqueModel     = require('../../models/endpoints/model_saque_atualizar_carteira');
const DadosCadastraisModel            = require('../../models/endpoints/model_dados_cadastrais');

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
            try {
                const solicitacao = await SolicitacaoSaqueModel.insertSolicitacao(id, amountStr, chavePixValue);
                logger.info(`Solicitação registrada. ID: ${solicitacao.insertId}`);
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

            // ETAPA 6 – Registro de Transações (Ledger)
            try {
                for (const venda of planoVenda) {
                    const valorTransacao = venda.qtd_vender * PRECO_TOKEN_FIXO;
                    await TransacoesPinsModel.transacoesPins(
                        id,
                        venda.token_id,
                        venda.qtd_vender,
                        valorTransacao.toFixed(2)
                    );
                }
            } catch (errSave) {
                logger.error('Erro ao registrar ledger de tokens', { userId: id, err: errSave });
                return res.status(500).json({ error: 'Erro ao registrar transações de venda.' });
            }

            // ETAPA 7 – Movimentação de Ativos (Usuário -> Purgatório)
            try {
                const tokensPurgatorio = await BuscarTokensCarteirasPurgModel.getTokensCarteiras(1);
                
                for (const venda of planoVenda) {
                    // Update Usuário
                    const tokenInfoUsuario = tokensUsuario.find(t => t.token_id === venda.token_id);
                    const novaQtdUser = Math.max(0, Number(tokenInfoUsuario?.quantidade_tokens ?? 0) - venda.qtd_vender);
                    await MoverPinsModel.removerPinsUsuario(venda.token_id, id, novaQtdUser);

                    // Update Sistema (Purgatório id:1)
                    const tokenInfoPurg = tokensPurgatorio.find(t => t.token_id === venda.token_id);
                    const novaQtdPurg = Number(tokenInfoPurg?.quantidade_tokens ?? 0) + venda.qtd_vender;
                    await MoverPinsModel.removerPinsUsuario(venda.token_id, 1, novaQtdPurg);
                }
            } catch (errUpdate) {
                logger.error('Erro na movimentação de ativos', { userId: id, err: errUpdate });
                return res.status(500).json({ error: 'Erro na atualização de custódia dos tokens.' });
            }

            // ETAPA 8 – Finalização do Saldo da Carteira
            let novo_valor_formatted;
            try {
                const saldoOriginalBig = decimalToBigInt(saldoOriginal);
                const saldoTruncBig = decimalToBigInt(saldoTrunc);
                const amountBig = decimalToBigInt(amountStr);

                const novo_valor_big = saldoOriginalBig - (saldoTruncBig - amountBig);
                novo_valor_formatted = bigIntToDecimalString(novo_valor_big);

                await AtualizarCarteiraSaqueModel.updateCarteira(novo_valor_formatted, id);
            } catch (errUpdateSaldo) {
                logger.error('Erro fatal ao atualizar saldo final', { userId: id, err: errUpdateSaldo });
                return res.status(500).json({ error: 'Erro ao atualizar saldo da carteira.' });
            }

            // Resposta de Sucesso
            const response = {
                message: 'Saque realizado com sucesso',
                details: {
                    valor_solicitado: amountStr,
                    saldo_anterior: saldoTrunc,
                    novo_saldo: novo_valor_formatted,
                    tokens_vendidos: quantidade_tokens_para_vender,
                    valor_investido_antes: investidoTrunc,
                    valor_investido_depois: bigIntToDecimalString(investidoAfterBig),
                    chave_pix: chavePixValue
                }
            };

            logger.info('Saque finalizado com sucesso', { userId: id, requestId: id });
            return res.status(200).json(response);

        } catch (err) {
            logger.error('Erro não tratado no fluxo de saque', { userId: id, err });
            return res.status(500).json({ error: 'Erro interno ao processar saque.' });
        }
    }
};

module.exports = SaqueController;
