const { validationResult } = require('express-validator');
const bcrypt               = require('bcrypt');
const pinBuscarModel       = require('../../models/senha_negociacao/model_pin_buscar');
const pinSalvarModel       = require('../../models/senha_negociacao/model_pin_salvar');
const tentativasModel      = require('../../models/senha_negociacao/model_pin_tentativas');
const logger               = require('../../logger');

async function alterarPin(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const usuarioId = parseInt(req.params.id, 10);
    const { pin_atual, pin_novo, pin_confirmacao } = req.body;

    if (req.session.user.id !== usuarioId) {
        logger.warn(`Acesso negado à alteração de PIN. Sessão: ${req.session.user.id}, alvo: ${usuarioId}`);
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    if (pin_novo !== pin_confirmacao) {
        return res.status(400).json({ success: false, message: 'O novo PIN e a confirmação não coincidem.' });
    }

    try {
        const dados = await pinBuscarModel.buscarPinPorId(usuarioId);

        if (!dados) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        if (!dados.senha_negociacao) {
            return res.status(404).json({ success: false, message: 'Nenhuma Senha de Negociação cadastrada. Use a opção de criação.' });
        }

        // Verifica bloqueio ativo
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

        const pinAtualCorreto = await bcrypt.compare(pin_atual, dados.senha_negociacao);

        if (!pinAtualCorreto) {
            await tentativasModel.registrarFalha(usuarioId);
            const tentativasRestantes = 5 - (dados.senha_negociacao_tentativas + 1);
            logger.warn(`PIN atual incorreto na alteração para o usuário ID ${usuarioId}. Restantes: ${Math.max(0, tentativasRestantes)}`);

            if (tentativasRestantes <= 0) {
                return res.status(423).json({ success: false, message: 'Conta bloqueada por 30 minutos após 5 tentativas incorretas.' });
            }

            return res.status(401).json({
                success: false,
                message: 'Senha de Negociação atual incorreta.',
                tentativas_restantes: tentativasRestantes,
            });
        }

        await pinSalvarModel.salvarPin(usuarioId, pin_novo);

        logger.info(`PIN de negociação alterado para o usuário ID: ${usuarioId}`);
        return res.status(200).json({ success: true, message: 'Senha de Negociação alterada com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao alterar PIN de negociação para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { alterarPin };
