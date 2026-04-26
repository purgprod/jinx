const gerarTemplateRecuperacaoSenha = (token) => {
    const link = `https://purg.com.br/senha-negociacao-recuperacao?token=${token}`;

    return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;900&display=swap');
    </style>

    <div style="background-color: #f7f7f7; padding: 40px 20px; font-family: 'Poppins', sans-serif; text-align: center;">

      <div style="max-width: 450px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); font-family: 'Poppins', sans-serif;">

        <div style="margin-bottom: 25px;">
          <img src="cid:logo_purg" alt="Purg Logo" style="width: 320px; height: auto; display: block; margin: 0 auto;">
        </div>

        <div style="width: 50px; height: 3px; background-color: #32d957; margin: 0 auto 25px auto; border-radius: 2px;"></div>

        <h2 style="color: #333333; font-size: 18px; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-family: 'Poppins', sans-serif;">
          RECUPERAÇÃO DE SENHA DE NEGOCIAÇÃO
        </h2>

        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 30px; font-weight: 400; font-family: 'Poppins', sans-serif;">
          Recebemos uma solicitação para redefinir sua Senha de Negociação.<br>
          Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>15 minutos</strong>.
        </p>

        <a href="${link}" style="display: inline-block; background-color: #32d957; color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 13px; letter-spacing: 1px; font-family: 'Poppins', sans-serif;">
          REDEFINIR SENHA DE NEGOCIAÇÃO
        </a>

        <p style="color: #999999; font-size: 12px; margin-top: 30px; line-height: 1.5; font-family: 'Poppins', sans-serif;">
          Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
        </p>
        <p style="color: #32d957; font-size: 11px; word-break: break-all; font-family: 'Courier New', monospace;">
          ${link}
        </p>

        <p style="color: #999999; font-size: 11px; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px; line-height: 1.4; font-weight: 300; font-family: 'Poppins', sans-serif;">
          Se você não solicitou essa alteração, ignore este e-mail. Sua senha permanece a mesma.<br>
          &copy; 2026 Purg.com.br
        </p>

      </div>
    </div>
  `;
};

module.exports = { gerarTemplateRecuperacaoSenha };
