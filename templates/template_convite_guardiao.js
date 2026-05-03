// templates/template_convite_guardiao.js
// E-mail enviado pelo dependente convidando alguém para ser seu guardião.

const gerarTemplateConviteGuardiao = ({ nomeTutelado, linkLogin, linkCadastro }) => {
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
          CONVITE — MODO FAMÍLIA
        </h2>

        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 30px; font-weight: 400; font-family: 'Poppins', sans-serif;">
          <strong>${nomeTutelado}</strong> te convidou para ser seu responsável na plataforma Purg e acompanhar sua jornada financeira.<br><br>
          Este convite é válido por <strong>7 dias</strong>.
        </p>

        <a href="${linkLogin}" style="display: inline-block; background-color: #32d957; color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 13px; letter-spacing: 1px; font-family: 'Poppins', sans-serif;">
          JÁ TENHO UMA CONTA
        </a>

        <br><br>

        <a href="${linkCadastro}" style="display: inline-block; background-color: #ffffff; color: #32d957; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 13px; letter-spacing: 1px; font-family: 'Poppins', sans-serif; border: 2px solid #32d957;">
          CRIAR UMA CONTA
        </a>

        <p style="color: #999999; font-size: 12px; margin-top: 30px; line-height: 1.5; font-family: 'Poppins', sans-serif;">
          Se os botões não funcionarem, copie e cole os links abaixo no seu navegador:
        </p>
        <p style="color: #555555; font-size: 11px; margin: 4px 0; font-family: 'Poppins', sans-serif;">Já tenho conta:</p>
        <p style="color: #32d957; font-size: 11px; word-break: break-all; font-family: 'Courier New', monospace; margin-bottom: 12px;">
          ${linkLogin}
        </p>
        <p style="color: #555555; font-size: 11px; margin: 4px 0; font-family: 'Poppins', sans-serif;">Criar conta:</p>
        <p style="color: #32d957; font-size: 11px; word-break: break-all; font-family: 'Courier New', monospace;">
          ${linkCadastro}
        </p>

        <p style="color: #999999; font-size: 11px; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px; line-height: 1.4; font-weight: 300; font-family: 'Poppins', sans-serif;">
          Se você não conhece esta pessoa ou não deseja aceitar, ignore este e-mail.<br>
          &copy; 2026 Purg.com.br
        </p>

      </div>
    </div>
  `;
};

module.exports = { gerarTemplateConviteGuardiao };
