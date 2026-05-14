const { validationResult } = require('express-validator');
const NamiToggleModel = require('../../models/webhook/model_nami_toggle');
const logger = require('../../logger');

class NamiUsuarioController {

    static async getNami(req, res) {
        const usuarioId = parseInt(req.params.id, 10);
        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        try {
            const ativo = await NamiToggleModel.getAtivo(usuarioId);
            if (ativo === null) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            return res.status(200).json({ nami_ativo: ativo ? 1 : 0 });
        } catch (err) {
            logger.error(`[Nami] Erro ao consultar nami_ativo do usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao consultar configuração da Nami.' });
        }
    }

    static async setNami(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const usuarioId = parseInt(req.params.id, 10);
        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const ativo = req.body.ativo ? 1 : 0;

        try {
            const affected = await NamiToggleModel.setAtivo(usuarioId, ativo);
            if (affected === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            logger.info(`[Nami] nami_ativo=${ativo} para usuario_id=${usuarioId}`);
            return res.status(200).json({ nami_ativo: ativo });
        } catch (err) {
            logger.error(`[Nami] Erro ao atualizar nami_ativo do usuário ${usuarioId}: ${err.message}`);
            return res.status(500).json({ error: 'Erro ao atualizar configuração da Nami.' });
        }
    }

}

module.exports = NamiUsuarioController;
