const nodemailer = require('nodemailer');
const path = require('path');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const enviarEmail = async (para, assunto, html) => {
  if (!emailRegex.test(para)) {
    logger.error(`Endereço de e-mail inválido: ${para}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Suporte Purg" <${process.env.EMAIL_USER}>`,
      to: para,
      subject: assunto,
      html: html,
      attachments: [{
        filename: 'purg_logo.png',
        path: path.join(__dirname, 'images', 'purg_logo.png'),
        cid: 'logo_purg'
      }]
    });
    logger.info(`E-mail enviado para ${para} | MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Erro ao enviar e-mail para ${para}: ${error.message}`);
    return false;
  }
};

module.exports = { enviarEmail };
