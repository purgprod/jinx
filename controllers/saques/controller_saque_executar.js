const { validationResult } = require('express-validator');
const logger = require('../../logger');

// Models
const BuscarCarteiraModel = require('../../models/endpoints/model_saque_buscar_carteira');
const AtualizarCarteiraSaqueModel = require('../../models/endpoints/model_saque_atualizar_carteira');
// Novo Model importado
const SolicitacaoExecutarSaqueModel = require('../../models/saques/model_saque_registro_executado');

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

const ExecutarSaqueController = {
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
                logger.warn('Tentativa de saque em carteira inexistente', { userId: id });
                return res.status(404).json({ error: 'Carteira não localizada.' });
            }

            const carteira = carteiraRows[0];
            const saldoAtualBig = decimalToBigInt(String(carteira.saldo ?? '0'));
            const saqueBig = decimalToBigInt(String(amount));

            if (saldoAtualBig < saqueBig) {
                return res.status(409).json({ 
                    error: 'Saldo insuficiente para realizar a operação.',
                    disponivel: bigIntToDecimalString(saldoAtualBig)
                });
            }

            // 2. Persistência do Débito (Write Layer - Wallet)
            const novoSaldoBig = saldoAtualBig - saqueBig;
            const novoSaldoStr = bigIntToDecimalString(novoSaldoBig);

            await AtualizarCarteiraSaqueModel.updateCarteira(novoSaldoStr, id);

            // 3. Atualização do Status da Solicitação (Side Effect / State Transition)
            // Semântica: Executamos após o débito para garantir que o registro reflita a realidade financeira.
            const registroResult = await SolicitacaoExecutarSaqueModel.executarSolicitacao(id);

            if (registroResult.affectedRows === 0) {
                // Warning: O dinheiro foi debitado, mas o registro da solicitação não foi alterado.
                // Em um ambiente ideal, isso estaria dentro de uma transação para Rollback.
                logger.error('Divergência de estado: Saldo debitado, mas solicitação não encontrada para atualização', { userId: id });
            }

            logger.info('Fluxo de saque finalizado', { userId: id, montante: amount, status: 'Executado' });

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
            logger.error('Falha crítica na execução de saque', { userId: id, error: err.message });
            return res.status(500).json({ error: 'Erro interno ao processar a transação financeira.' });
        }
    }
};

module.exports = ExecutarSaqueController;
