const { validationResult } = require('express-validator');
const bcrypt               = require('bcrypt');
const senhaBuscarModel     = require('../../models/senha_negociacao/model_senha_buscar');
const senhaSalvarModel     = require('../../models/senha_negociacao/model_senha_salvar');
const tentativasModel      = require('../../models/senha_negociacao/model_senha_tentativas');
const logger               = require('../../logger');

async function alterarSenha(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = parseInt(req.params.id, 10);
    const { senha_atual, senha_nova, senha_confirmacao } = req.body;

    if (req.session.user.id !== usuarioId) {
        logger.warn(`Acesso negado à alteração de Senha de Negociação. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    if (senha_nova !== senha_confirmacao) {
        return res.status(400).json({ success: false, message: 'A nova Senha de Negociação e a confirmação não coincidem.' });
    }

    try {
        const dados = await senhaBuscarModel.buscarSenhaPorId(usuarioId);

        if (!dados) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        if (!dados.senha_negociacao) {
            return res.status(404).json({ success: false, message: 'Nenhuma Senha de Negociação cadastrada. Use a opção de criação.' });
        }

        if (dados.senha_negociacao_bloqueio_ate) {
            const bloqueioAte = new Date(dados.senha_negociacao_bloqueio_ate);
            if (bloqueioAte > new Date()) {
                const minutosRestantes = Math.ceil((bloqueioAte - Date.now()) / 60000);
                return res.status(423).json({
                    success: false,
                    message: `Conta bloqueada por excesso de tentativas. Tente novamente em ${minutosRestantes} minuto(s).`,
                });
            }
        }

        const senhaAtualCorreta = await bcrypt.compare(senha_atual, dados.senha_negociacao);

        if (!senhaAtualCorreta) {
            await tentativasModel.registrarFalha(usuarioId);
            const tentativasRestantes = 5 - (dados.senha_negociacao_tentativas + 1);
            logger.warn(`Senha de Negociação atual incorreta na alteração para o usuário ID ${usuarioId}. Restantes: ${Math.max(0, tentativasRestantes)}`);

            if (tentativasRestantes <= 0) {
                return res.status(423).json({ success: false, message: 'Conta bloqueada por 30 minutos após 5 tentativas incorretas.' });
            }

            return res.status(401).json({
                success: false,
                message: 'Senha de Negociação atual incorreta.',
                tentativas_restantes: tentativasRestantes,
            });
        }

        await senhaSalvarModel.salvarSenha(usuarioId, senha_nova);

        logger.info(`Senha de Negociação alterada para o usuário ID: ${usuarioId}`);
        return res.status(200).json({ success: true, message: 'Senha de Negociação alterada com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao alterar Senha de Negociação para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { alterarSenha };
