const { validationResult } = require('express-validator');
const logger = require('../../logger');

const BuscarCarteiraModel             = require('../../models/endpoints/model_saque_buscar_carteira');
const BuscarTokensCarteirasModel      = require('../../models/endpoints/model_saque_buscar_tokens');
const BuscarTokensCarteirasPurgModel  = require('../../models/endpoints/model_saque_buscar_tokens_purg');
const TransacoesPinsModel             = require('../../models/endpoints/model_saque_transacoes_pins_para_purg');
const MoverPinsModel                  = require('../../models/endpoints/model_saque_mover_pins');
const SolicitacaoSaqueModel           = require('../../models/endpoints/model_saque_registro_solicitacao');
const AtualizarCarteiraSaqueModel     = require('../../models/endpoints/model_saque_atualizar_carteira');
const DadosCadastraisModel            = require('../../models/endpoints/model_dados_cadastrais');

const SCALE   = 8;
const TEN_POW = 10n ** BigInt(SCALE);

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

        // Validações iniciais
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Falha de validação no saque', { userId: id, errors: errors.array() });
            return res.status(400).json({ errors: errors.array() });
        }

        if (amount === null) {
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

        logger.info('Iniciando saque', { userId: id, amount: amountStr });

        try {
            // ETAPA 1 – Buscar saldo e investido
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

            // ETAPA 2 – Buscar dados cadastrais
            const dadosCadastrais = await DadosCadastraisModel.getDadosCadastrais(id);
            const chavePixValue = dadosCadastrais ? dadosCadastrais[chave_pix] : null;
            if (!chavePixValue) {
                return res.status(404).json({ error: `Chave PIX (${chave_pix}) não encontrada para o usuário ${id}` });
            }

            // ETAPA 3 – Registrar solicitação de saque
            try {
                const solicitacao = await SolicitacaoSaqueModel.insertSolicitacao(id, amountStr, chavePixValue);
                logger.info(`Solicitação de saque registrada com sucesso. ID da solicitação: ${solicitacao.insertId}`);
            } catch (errRegister) {
                logger.error('Falha ao registrar solicitação de saque', { userId: id, err: errRegister });
                return res.status(500).json({ error: 'Erro ao registrar solicitação de saque.' });
            }

            // ETAPA 4 – Calcular venda_tokens
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

            const quantidade_tokens_para_venderBig = (venda_tokensBig * 100n) / TEN_POW; // Truncado
            const quantidade_tokens_para_vender = Number(quantidade_tokens_para_venderBig); // inteiro

            // ETAPA 5 – Buscar tokens do usuário e balancear a venda
            let tokensUsuario = [];
            try {
                tokensUsuario = await BuscarTokensCarteirasModel.getTokensCarteiras(id);
                logger.info('Tokens do usuário obtidos:', tokensUsuario);
            } catch (errTokens) {
                logger.error('Erro ao buscar tokens (Etapa 4)', { userId: id, err: errTokens });
                return res.status(500).json({ error: 'Erro ao buscar tokens do usuário.' });
            }

            const planoVenda = balancearVendas(tokensUsuario, quantidade_tokens_para_vender);
            logger.info('Plano de venda preparado:', planoVenda);

            // ETAPA 6 – Registrar transações de venda
            const resultadosTransacoes = [];
            try {
                for (const venda of planoVenda) {
                    const valorTransacao = venda.qtd_vender * PRECO_TOKEN_FIXO;
                    const resultado = await TransacoesPinsModel.transacoesPins(
                        id,
                        venda.token_id,
                        venda.qtd_vender,
                        valorTransacao.toFixed(2)
                    );
                    resultadosTransacoes.push({
                        token_id: venda.token_id,
                        qtd_vendida: venda.qtd_vender,
                        valor_transacao: valorTransacao.toFixed(2),
                        mysql: { affectedRows: resultado.affectedRows, insertId: resultado.insertId }
                    });
                }
            } catch (errSave) {
                logger.error('Falha ao registrar transações (Etapa 6)', { userId: id, err: errSave });
                return res.status(500).json({ error: 'Erro ao registrar transações de venda.' });
            }

            // ETAPA 7 – Atualizar quantidade de tokens do usuário e do sistema
            const resultadosAtualizacaoUsuario = [];
            const resultadosAtualizacaoPurgatorio = [];
            let tokensPurgatorio = [];
            try {
                tokensPurgatorio = await BuscarTokensCarteirasPurgModel.getTokensCarteiras(1);
                logger.info(`Tokens do purgatório (usuario_id=1): ${JSON.stringify(tokensPurgatorio)}`);
            } catch (errPurg) {
                logger.error('Erro ao buscar tokens do purgatório (usuario_id=1)', { err: errPurg });
                return res.status(500).json({ error: 'Erro ao buscar tokens do sistema.' });
            }

            try {
                for (const venda of planoVenda) {
                    // Atualizar tokens do usuário que está vendendo
                    const tokenInfoUsuario = tokensUsuario.find(t => t.token_id === venda.token_id);
                    const quantidadeAtualUsuario = Number(tokenInfoUsuario?.quantidade_tokens ?? 0);
                    const novaQuantidadeUsuario = Math.max(0, quantidadeAtualUsuario - venda.qtd_vender);

                    const resultadoUsuario = await MoverPinsModel.removerPinsUsuario(
                        venda.token_id,
                        id,
                        novaQuantidadeUsuario
                    );

                    resultadosAtualizacaoUsuario.push({
                        token_id: venda.token_id,
                        quantidade_before: quantidadeAtualUsuario,
                        quantidade_after: novaQuantidadeUsuario,
                        mysql: { affectedRows: resultadoUsuario.affectedRows }
                    });

                    // Atualizar tokens do purgatório (usuario_id = 1)
                    const tokenInfoPurg = tokensPurgatorio.find(t => t.token_id === venda.token_id);
                    const quantidadeAtualPurg = Number(tokenInfoPurg?.quantidade_tokens ?? 0);
                    const novaQuantidadePurg = quantidadeAtualPurg + venda.qtd_vender;

                    const resultadoPurg = await MoverPinsModel.removerPinsUsuario(
                        venda.token_id,
                        1,
                        novaQuantidadePurg
                    );

                    resultadosAtualizacaoPurgatorio.push({
                        token_id: venda.token_id,
                        quantidade_before: quantidadeAtualPurg,
                        quantidade_after: novaQuantidadePurg,
                        mysql: { affectedRows: resultadoPurg.affectedRows }
                    });
                }
            } catch (errUpdate) {
                logger.error('Falha ao atualizar tokens (Etapa 7)', { userId: id, err: errUpdate });
                return res.status(500).json({ error: 'Erro ao atualizar quantidade de tokens após venda.' });
            }

            // ETAPA 8 – Atualizar saldo da carteira
            let novo_valor_formatted = '0.00'; // Inicialização padrão
            try {
                const saldoOriginalBig = decimalToBigInt(saldoOriginal);
                const saldoTruncBig = decimalToBigInt(saldoTrunc);
                const amountBig = decimalToBigInt(amountStr);

                const novo_valor_big = saldoOriginalBig - (saldoTruncBig - amountBig);
                novo_valor_formatted = bigIntToDecimalString(novo_valor_big);

                if (isNaN(novo_valor_formatted) || typeof novo_valor_formatted !== 'string') {
                    throw new Error('Formato do novo valor está incorreto.');
                }

                const resultadoAtualizacao = await AtualizarCarteiraSaqueModel.updateCarteira(novo_valor_formatted, id);
                logger.info(`Saldo da carteira atualizado com sucesso para o usuário ${id}`);
                logger.info(`Resultado da atualização: ${JSON.stringify(resultadoAtualizacao)}`);
            } catch (errUpdateSaldo) {
                logger.error('Falha ao atualizar saldo da carteira', {
                    userId: id,
                    err: errUpdateSaldo,
                    novo_valor: novo_valor_formatted
                });
                return res.status(500).json({
                    error: 'Erro ao atualizar saldo da carteira.',
                    novo_valor: novo_valor_formatted
                });
            }

            // Resposta Simplificada
            try {
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

                logger.info('Resposta final:', response);
                return res.status(200).json(response);
            } catch (errResponse) {
                logger.error('Erro ao preparar a resposta', {
                    userId: id,
                    err: errResponse
                });
                return res.status(500).json({
                    error: 'Erro ao processar a resposta do saque.',
                    detalhes: errResponse.message
                });
            }
        } catch (err) {
            logger.error('Erro inesperado no saque', { userId: id, err });
            return res.status(500).json({ error: 'Erro ao processar saque.' });
        }
    }
};

module.exports = SaqueController;

