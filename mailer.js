require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarEmail = async (para, assunto, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Suporte Purg" <${process.env.EMAIL_USER}>`,
      to: para,
      subject: assunto,
      html: html,
      // Configuracao do anexo para a logo aparecer no corpo do e-mail
      attachments: [{
        filename: 'purg_logo.png',
        path: '/root/dados/jinx/images/purg_logo.png', // Caminho absoluto no seu Linux
        cid: 'logo_purg' // Deve ser igual ao src="cid:logo_purg" do template
      }]
    });
    // Removi o emote do log como solicitado anteriormente
    console.log("Saida SMTP: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Erro SMTP:", error.message);
    return false;
  }
};

module.exports = { enviarEmail };
