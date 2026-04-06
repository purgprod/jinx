const gerarTemplateSenha = (novaSenha) => {
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
          RECUPERAÇÃO DE CONTA
        </h2>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 30px; font-weight: 400; font-family: 'Poppins', sans-serif;">
          Foi solicitada uma nova senha de acesso. Use o código abaixo para entrar no sistema.
        </p>
        
        <div style="background-color: #f0f0f0; border: 1px dashed #32d957; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
          <span style="color: #28a745; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 10px; font-weight: 600; font-family: 'Poppins', sans-serif;">
            SEGUE A SUA NOVA SENHA
          </span>
          <code style="color: #000000; font-size: 32px; font-family: 'Courier New', monospace; letter-spacing: 4px; font-weight: bold;">
            ${novaSenha}
          </code>
        </div>
        
        <a href="https://purg.com.br/login" style="display: inline-block; background-color: #32d957; color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 13px; letter-spacing: 1px; font-family: 'Poppins', sans-serif;">
          ACESSAR AGORA
        </a>
        
        <p style="color: #999999; font-size: 11px; margin-top: 45px; border-top: 1px solid #f0f0f0; padding-top: 20px; line-height: 1.4; font-weight: 300; font-family: 'Poppins', sans-serif;">
          Este é um e-mail automático. Se não solicitou, altere suas credenciais.<br>
          &copy; 2026 Purg.com.br
        </p>
        
      </div>
    </div>
  `;
};

module.exports = { gerarTemplateSenha };
