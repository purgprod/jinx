// services/efi_cartao.js
// Wrapper do SDK Efí Bank para cobrança de cartão de crédito (one-step).
//
// O cartão é tokenizado no frontend via JS SDK do Efí — o backend recebe apenas
// o payment_token e nunca manipula dados sensíveis do cartão.
//
// Diferença em relação ao efi_pix.js:
//   • Cartão NÃO requer certificado mTLS (apenas OAuth2 client_id + client_secret).
//   • O resultado é síncrono: status 'approved' = aprovado imediatamente.

const EfiPay = require('sdk-node-apis-efi');
const logger = require('../logger');

function criarInstancia() {
    const clientId     = process.env.EFI_CLIENT_ID;
    const clientSecret = process.env.EFI_CLIENT_SECRET;
    const sandbox      = process.env.EFI_SANDBOX === 'true';

    if (!clientId || !clientSecret) {
        throw new Error('EFI_CLIENT_ID e EFI_CLIENT_SECRET devem estar definidos no .env');
    }

    return new EfiPay({ client_id: clientId, client_secret: clientSecret, sandbox });
}

let _efi = null;
function getEfi() {
    if (!_efi) _efi = criarInstancia();
    return _efi;
}

// ---------------------------------------------------------------------------
// Cria e paga uma cobrança de cartão de crédito em um único passo (one-step).
//
// @param {object} p
// @param {string}  p.paymentToken   Token gerado pelo JS SDK do Efí no frontend
// @param {string}  p.valor          Valor com 2 decimais ex: "150.00"
// @param {string}  p.cpf            CPF do titular (11 dígitos)
// @param {string}  p.nome           Nome completo do titular
// @param {string}  p.email          E-mail do titular
// @param {string}  [p.telefone]     Celular (10-11 dígitos)
// @param {string}  [p.nascimento]   Data de nascimento YYYY-MM-DD
// @param {object}  [p.endereco]     { logradouro, numero, bairro, cep, cidade, estado, complemento }
// @param {string}  [p.descricao]    Descrição exibida na fatura
//
// @returns {Promise<{ chargeId: number, status: string, total: number }>}
//   status: 'approved' | 'waiting' | outro (recusa)
// ---------------------------------------------------------------------------
async function cobrarCartao({ paymentToken, valor, cpf, nome, email, telefone, nascimento, endereco, descricao = 'Aporte Meta Purg' }) {
    try {
        const efi = getEfi();

        const valorCentavos = Math.round(parseFloat(valor) * 100);
        if (!valorCentavos || valorCentavos <= 0) {
            throw new Error(`Valor inválido para cobrança: ${valor}`);
        }

        const customer = { name: nome, cpf, email };
        if (telefone)   customer.phone_number = String(telefone).replace(/\D/g, '');
        if (nascimento) customer.birth = nascimento;

        const creditCard = {
            customer,
            installments:  1,
            payment_token: paymentToken
        };

        if (endereco?.logradouro) {
            creditCard.billing_address = {
                street:       endereco.logradouro,
                number:       String(endereco.numero || 'S/N'),
                neighborhood: endereco.bairro      || '',
                zipcode:      String(endereco.cep  || '').replace(/\D/g, ''),
                city:         endereco.cidade      || '',
                complement:   endereco.complemento || '',
                state:        endereco.estado      || ''
            };
        }

        const body = {
            items: [{ name: descricao, value: valorCentavos, amount: 1 }],
            payment: { credit_card: creditCard }
        };

        const resposta = await efi.createOneStepCharge({}, body);
        const data = resposta.data ?? resposta;

        logger.info(`[EfiCartao] Cobrança criada. chargeId=${data.charge_id}, status=${data.status}, total=${data.total}`);

        return {
            chargeId: data.charge_id,
            status:   data.status,
            total:    data.total
        };

    } catch (err) {
        const detalhe = err.response?.data ?? err.message;
        logger.error('[EfiCartao] Erro ao cobrar cartão:', detalhe);
        const mensagem = typeof detalhe === 'object'
            ? (detalhe.error_description || detalhe.error || JSON.stringify(detalhe))
            : String(detalhe);
        throw new Error(mensagem);
    }
}

module.exports = { cobrarCartao };
