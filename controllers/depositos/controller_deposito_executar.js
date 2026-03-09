const { validationResult } = require('express-validator');
const logger = require('../../logger');

// Models
const BuscarCarteiraModel = require('../../models/endpoints/model_buscar_saldo_carteira');
const AtualizarCarteiraModel = require('../../models/endpoints/model_atualizar_saldo_carteira');
// Novo Model importado
const SolicitacaoExecutarDepositoModel = require('../../models/depositos/model_deposito_registro_executado');

const SCALE = 8;
const TEN_POW = 10n ** BigInt(SCALE);

function decimalToBigInt(value) {
    if (value === null || value === undefined) return 0n;
    let s = typeof value === 'number' ? value.toString() : String(value);
    s = s.trim();
    if (s === '') return 0n;
    const [intPart, fracPart = ''] = s.split('.');
    const big = BigInt(intPart) * TEN_POW + BigInt(fracPart.slice(0, SCALE).padEnd(SCALE, '0'));
    return big;
}

function bigIntToDecimalString(bi) {
    const abs = bi < 0n ? -bi : bi;
    const intPart = abs / TEN_POW;
    const fracNum = abs % TEN_POW;
    const fracPart = fracNum.toString().padStart(SCALE, '0').replace(/0+$/, '');
    return (bi < 0n ? '-' : '') + (fracPart ? `${intPart}.${fracPart}` : `${intPart}`);
}

const ExecutarDepositoController = {
    async execute(req, res) {
        const { id } = req.params; 
        const { amount } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // 1. Recuperação e Validação de Saldo
            const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(id);
            
            if (!carteiraRows?.length) {
                logger.warn('Tentativa de deposito em carteira inexistente', { userId: id });
                return res.status(404).json({ error: 'Carteira não localizada.' });
            }

            const carteira = carteiraRows[0];
            const saldoAtualBig = decimalToBigInt(String(carteira.saldo ?? '0'));
            const depositoBig = decimalToBigInt(String(amount));

            // 2. Persistência do Crédito (Write Layer + Wallet)
            const novoSaldoBig = saldoAtualBig + depositoBig;
            const novoSaldoStr = bigIntToDecimalString(novoSaldoBig);

            await AtualizarCarteiraModel.updateCarteira(novoSaldoStr, id);

            // 3. Atualização do Status da Solicitação (Side Effect / State Transition)
            // Semântica: Executamos após o crédito para garantir que o registro reflita a realidade financeira.
            const registroResult = await SolicitacaoExecutarDepositoModel.executarSolicitacao(id);

            if (registroResult.affectedRows === 0) {
                // Warning: O dinheiro foi creditado, mas o registro da solicitação não foi alterado.
                // Em um ambiente ideal, isso estaria dentro de uma transação para Rollback.
                logger.error('Divergência de estado: Saldo creditado, mas solicitação não encontrada para atualização', { userId: id });
            }

            logger.info('Fluxo de deposito finalizado', { userId: id, montante: amount, status: 'Executado' });

            return res.status(200).json({
                success: true,
                data: {
                    usuario_id: id,
                    valor_debitado: amount,
                    saldo_remanescente: novoSaldoStr,
                    status_solicitacao: 'Executado'
                }
            });

        } catch (err) {
            logger.error('Falha crítica na execução de deposito', { userId: id, error: err.message });
            return res.status(500).json({ error: 'Erro interno ao processar a transação financeira.' });
        }
    }
};

module.exports = ExecutarDepositoController;
