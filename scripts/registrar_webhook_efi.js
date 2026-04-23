// Script de uso único: registra a URL do webhook Pix na Efí Bank.
// Execute com: node scripts/registrar_webhook_efi.js

require('dotenv').config();
const EfiPay = require('sdk-node-apis-efi');

const CHAVE_PIX   = '24a60c57-d776-4f3f-8a3e-3f902c7e66c7';
const WEBHOOK_URL = 'https://jinx.purg.com.br/api/pix/webhook';

async function registrar() {
    const efi = new EfiPay({
        client_id:     process.env.EFI_CLIENT_ID,
        client_secret: process.env.EFI_CLIENT_SECRET,
        certificate:   process.env.EFI_CERT_PATH,
        sandbox:       process.env.EFI_SANDBOX === 'true'
    });

    console.log(`Registrando webhook para chave Pix: ${CHAVE_PIX}`);
    console.log(`URL: ${WEBHOOK_URL}`);

    try {
        const resposta = await efi.pixConfigWebhook(
            { chave: CHAVE_PIX },
            { webhookUrl: WEBHOOK_URL }
        );
        console.log('Webhook registrado com sucesso!');
        console.log(resposta);
    } catch (err) {
        console.error('Erro ao registrar webhook:');
        console.error(err.response?.data ?? err.message);
        process.exit(1);
    }
}

registrar();
