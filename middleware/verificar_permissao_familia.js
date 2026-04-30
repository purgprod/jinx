const PermissoesModel = require('../models/familia/model_permissoes');
const logger          = require('../logger');

const MENSAGENS = {
    pode_sacar:            'Saque não autorizado pelo seu responsável.',
    pode_depositar:        'Depósito não autorizado pelo seu responsável.',
    pode_criar_objetivos:  'Criação de objetivos não autorizada pelo seu responsável.',
    pode_alterar_perfil:   'Alteração de perfil não autorizada pelo seu responsável.',
    pode_alterar_pix:      'Alteração de chaves Pix não autorizada pelo seu responsável.',
};

/**
 * Cria um middleware que bloqueia a operação caso o usuário seja tutelado
 * e a permissão correspondente não esteja habilitada.
 *
 * Uso: verificarPermissaoFamilia('pode_sacar')
 */
function verificarPermissaoFamilia(permissao) {
    return async (req, res, next) => {
        if (req.session.tipo !== 'guardiao_atuando') {
            return next();
        }

        const tuteladoId = req.session.user.id;

        try {
            const permissoes = await PermissoesModel.buscarPorTutelado(tuteladoId);

            if (!permissoes) {
                logger.warn(`Permissões não encontradas para tutelado ${tuteladoId}`);
                return res.status(403).json({ error: 'Operação não autorizada pelo responsável.' });
            }

            if (!permissoes[permissao]) {
                logger.warn(`Tutelado ${tuteladoId} bloqueado por permissão '${permissao}'`);
                return res.status(403).json({ error: MENSAGENS[permissao] || 'Operação não autorizada pelo responsável.' });
            }

            next();
        } catch (err) {
            logger.error(`Erro ao verificar permissão familiar '${permissao}': ${err.message}`);
            return res.status(500).json({ error: 'Erro ao verificar permissões.' });
        }
    };
}

/**
 * Middleware específico para saque: verifica 'pode_sacar' e valida
 * que a chave Pix escolhida está na lista de chaves autorizadas.
 */
function verificarPermissaoSaqueFamilia() {
    return async (req, res, next) => {
        if (req.session.tipo !== 'guardiao_atuando') {
            return next();
        }

        const tuteladoId = req.session.user.id;

        try {
            const permissoes = await PermissoesModel.buscarPorTutelado(tuteladoId);

            if (!permissoes) {
                return res.status(403).json({ error: 'Operação não autorizada pelo responsável.' });
            }

            if (!permissoes.pode_sacar) {
                return res.status(403).json({ error: MENSAGENS.pode_sacar });
            }

            const chaveSolicitada = req.body.chave_pix;
            const chavesAutorizadas = permissoes.chaves_pix_autorizadas || [];

            if (!chavesAutorizadas.includes(chaveSolicitada)) {
                logger.warn(`Tutelado ${tuteladoId} tentou sacar para chave não autorizada: ${chaveSolicitada}`);
                return res.status(403).json({ error: 'A chave Pix selecionada não foi autorizada pelo seu responsável.' });
            }

            next();
        } catch (err) {
            logger.error(`Erro ao verificar permissão de saque familiar: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao verificar permissões.' });
        }
    };
}

module.exports = { verificarPermissaoFamilia, verificarPermissaoSaqueFamilia };
