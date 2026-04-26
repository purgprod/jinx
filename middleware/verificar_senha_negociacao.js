const bcrypt          = require('bcrypt');
const senhaBuscarModel = require('../models/senha_negociacao/model_senha_buscar');
const tentativasModel  = require('../models/senha_negociacao/model_senha_tentativas');
const logger           = require('../logger');

const SENHA_REGEX = /^\d{4}$/;

module.exports = async function verificarSenhaNegociacao(req, res, next) {
    const usuarioId = req.session?.user?.id;
    const { senha } = req.body;

    if (!senha || !SENHA_REGEX.test(senha)) {
        return res.status(400).json({ error: 'Senha de Negociação inválida. Informe exatamente 4 dígitos numéricos.' });
    }

    try {
        const dados = await senhaBuscarModel.buscarSenhaPorId(usuarioId);

        if (!dados || !dados.senha_negociacao) {
            return res.status(403).json({ error: 'Você ainda não possui uma Senha de Negociação cadastrada. Cadastre antes de realizar saques.' });
        }

        if (dados.senha_negociacao_bloqueio_ate) {
            const bloqueioAte = new Date(dados.senha_negociacao_bloqueio_ate);
            if (bloqueioAte > new Date()) {
                const segundosRestantes = Math.ceil((bloqueioAte - Date.now()) / 1000);
                const minutosRestantes  = Math.ceil(segundosRestantes / 60);
                logger.warn(`Senha de Negociação bloqueada para usuário ID ${usuarioId}. Restam ${minutosRestantes} minuto(s).`);
                return res.status(423).json({
                    error: `Senha de Negociação bloqueada por excesso de tentativas. Tente novamente em ${minutosRestantes} minuto(s).`,
                    bloqueado_ate: dados.senha_negociacao_bloqueio_ate,
                });
            }
        }

        const senhaCorreta = await bcrypt.compare(senha, dados.senha_negociacao);

        if (!senhaCorreta) {
            await tentativasModel.registrarFalha(usuarioId);

            const tentativasRestantes = 5 - (dados.senha_negociacao_tentativas + 1);
            logger.warn(`Senha de Negociação incorreta para o usuário ID ${usuarioId}. Tentativas restantes: ${Math.max(0, tentativasRestantes)}`);

            if (tentativasRestantes <= 0) {
                return res.status(423).json({ error: 'Senha de Negociação bloqueada por 30 minutos após 5 tentativas incorretas.' });
            }

            return res.status(401).json({
                error: 'Senha de Negociação incorreta.',
                tentativas_restantes: tentativasRestantes,
            });
        }

        await tentativasModel.zerarTentativas(usuarioId);
        next();
    } catch (error) {
        logger.error(`Erro no middleware de Senha de Negociação para o usuário ID ${usuarioId}: ${error.message}`);
        return res.status(500).json({ error: 'Erro interno ao verificar Senha de Negociação.' });
    }
};
