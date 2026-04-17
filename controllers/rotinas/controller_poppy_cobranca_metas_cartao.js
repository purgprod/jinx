// controllers/rotinas/controller_poppy_cobranca_metas_cartao.js
// Rotina mensal: cobra no cartão de crédito o valor total das metas ativas do usuário.
//
// Fluxo por usuário:
//   1. Registra cobrança como 'Processando'
//   2. Chama Efí Bank (createOneStepCharge — resultado síncrono)
//   3. 'approved' → credita carteira + aloca objetivos + marca 'Aprovada' (atômico)
//   4. 'waiting'  → mantém 'Processando' (análise antifraude — requer revisão manual)
//   5. Erro/recusa → marca 'Recusada'

const logger = require('../../logger');

const { cobrarCartao }              = require('../../services/efi_cartao');
const { withTransaction }           = require('../../database/transaction');
const { alocarSaldoEntreObjetivos } = require('../../services/objetivos_service');
const { sincronizarLigaUsuario }    = require('../../services/liga_service');

const UsuariosParaCobrarModel  = require('../../models/cartoes/model_usuarios_para_cobrar');
const CobrancaInserirModel     = require('../../models/cartoes/model_cobranca_inserir');
const CobrancaAtualizarModel   = require('../../models/cartoes/model_cobranca_atualizar');
const BuscarCarteiraModel      = require('../../models/endpoints/model_buscar_saldo_carteira');
const AtualizarCarteiraModel   = require('../../models/endpoints/model_atualizar_saldo_carteira');

// ---------------------------------------------------------------------------
// Utilitários BigInt (mesmo padrão do webhook Pix)
// ---------------------------------------------------------------------------
const SCALE   = 8;
const TEN_POW = 10n ** BigInt(SCALE);

function decimalToBigInt(value) {
    if (value === null || value === undefined) return 0n;
    let s = typeof value === 'number' ? value.toString() : String(value);
    s = s.trim();
    if (s === '') return 0n;
    const [intPart, fracPart = ''] = s.split('.');
    return BigInt(intPart) * TEN_POW + BigInt(fracPart.slice(0, SCALE).padEnd(SCALE, '0'));
}

function bigIntToDecimalString(bi) {
    const abs      = bi < 0n ? -bi : bi;
    const intPart  = abs / TEN_POW;
    const fracNum  = abs % TEN_POW;
    const fracPart = fracNum.toString().padStart(SCALE, '0').replace(/0+$/, '');
    return (bi < 0n ? '-' : '') + (fracPart ? `${intPart}.${fracPart}` : `${intPart}`);
}

// ---------------------------------------------------------------------------
// Primeiro dia do mês atual no formato YYYY-MM-01
// ---------------------------------------------------------------------------
function referenciaMesAtual() {
    const hoje = new Date();
    const ano  = hoje.getFullYear();
    const mes  = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}-01`;
}

// ---------------------------------------------------------------------------
// Descrição legível da cobrança para a fatura do cartão
// ---------------------------------------------------------------------------
function descricaoFatura() {
    const mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `Aporte mensal Purg — ${mes}`;
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------
const CobrancaMetasCartaoController = {
    async executarCobrancas(req, res) {
        res.status(200).json({ message: 'Rotinas executadas com sucesso' });

        const referenciaMes = referenciaMesAtual();
        const descricao     = descricaoFatura();

        let totalAprovadas = 0, totalWaiting = 0, totalRecusadas = 0;

        let usuarios;
        try {
            usuarios = await UsuariosParaCobrarModel.getUsuariosParaCobrar();
        } catch (err) {
            logger.error('[CobrancaCartao] Erro ao buscar usuários elegíveis.', { erro: err.message });
            return;
        }

        logger.info(`[CobrancaCartao] Iniciando cobrança mensal. ${usuarios.length} usuário(s) elegível(is).`);

        for (const usuario of usuarios) {
            const uid   = usuario.usuario_id;
            const valor = String(usuario.valor_total);

            let cobrancaId;
            try {
                cobrancaId = await CobrancaInserirModel.inserir({ usuarioId: uid, valor, referenciaMes });
            } catch (err) {
                logger.error(`[CobrancaCartao] Erro ao registrar cobrança. userId=${uid}`, { erro: err.message });
                continue;
            }

            // --- Chama Efí Bank ---
            let resultadoEfi;
            try {
                resultadoEfi = await cobrarCartao({
                    paymentToken: usuario.payment_token,
                    valor,
                    cpf:          usuario.cpf,
                    nome:         usuario.nome_completo,
                    email:        usuario.email,
                    telefone:     usuario.celular,
                    nascimento:   usuario.nascimento,
                    endereco: {
                        logradouro:  usuario.logradouro,
                        numero:      usuario.numero_da_rua,
                        complemento: usuario.complemento,
                        bairro:      usuario.bairro,
                        cep:         usuario.cep,
                        cidade:      usuario.cidade,
                        estado:      usuario.estado
                    },
                    descricao
                });
            } catch (errEfi) {
                await CobrancaAtualizarModel.atualizarStatus(cobrancaId, 'Recusada', errEfi.message);
                logger.warn(`[CobrancaCartao] Recusada. userId=${uid}, motivo=${errEfi.message}`);
                totalRecusadas++;
                continue;
            }

            // --- Análise antifraude pendente ---
            if (resultadoEfi.status !== 'approved') {
                await CobrancaAtualizarModel.atualizarStatus(
                    cobrancaId,
                    'Processando',
                    `Status retornado pelo Efí: ${resultadoEfi.status}`
                );
                logger.info(`[CobrancaCartao] Em análise. userId=${uid}, status=${resultadoEfi.status}, chargeId=${resultadoEfi.chargeId}`);
                totalWaiting++;
                continue;
            }

            // --- Aprovada: credita carteira + aloca objetivos (atômico) ---
            try {
                const carteiraRows = await BuscarCarteiraModel.getSaldosCarteiras(uid);
                if (!carteiraRows?.length) throw new Error(`Carteira não encontrada. userId=${uid}`);

                const novoSaldo = bigIntToDecimalString(
                    decimalToBigInt(String(carteiraRows[0].saldo ?? '0')) + decimalToBigInt(valor)
                );

                await withTransaction(async (conn) => {
                    await AtualizarCarteiraModel.updateCarteira(novoSaldo, uid, conn);
                    await alocarSaldoEntreObjetivos(conn, uid, valor);
                    await CobrancaAtualizarModel.atualizarAprovada(cobrancaId, resultadoEfi.chargeId, conn);
                });

                setImmediate(async () => {
                    try {
                        await sincronizarLigaUsuario(uid);
                    } catch (e) {
                        logger.error(`[CobrancaCartao] Erro ao sincronizar liga. userId=${uid}`, { erro: e.message });
                    }
                });

                logger.info(`[CobrancaCartao] Aprovada. userId=${uid}, valor=${valor}, chargeId=${resultadoEfi.chargeId}`);
                totalAprovadas++;

            } catch (err) {
                await CobrancaAtualizarModel.atualizarStatus(cobrancaId, 'Recusada', `Erro interno pós-aprovação: ${err.message}`);
                logger.error(`[CobrancaCartao] Erro pós-aprovação. userId=${uid}`, { erro: err.message });
                totalRecusadas++;
            }
        }

        logger.info(`[CobrancaCartao] Concluída. aprovadas=${totalAprovadas}, aguardando=${totalWaiting}, recusadas=${totalRecusadas}`);
    }
};

module.exports = CobrancaMetasCartaoController;
