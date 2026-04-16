// controllers/endpoints/controller_historico_patrimonio.js

const HistoricoPatrimonioModel = require('../../models/endpoints/model_historico_patrimonio');
const logger = require('../../logger');

class HistoricoPatrimonioController {

    static async getHistoricoPatrimonio(req, res) {
        const usuarioId = parseInt(req.params.id, 10);

        if (req.session?.user?.id !== usuarioId) {
            return res.status(403).json({ success: false, message: 'Acesso negado.' });
        }

        try {
            const historico = await HistoricoPatrimonioModel.getHistoricoPatrimonio(usuarioId);

            if (!historico || historico.length === 0) {
                return res.status(404).json({ success: false, message: 'Nenhum dado de patrimônio encontrado.' });
            }

            return res.status(200).json({ success: true, historico });

        } catch (error) {
            logger.error(`Erro ao buscar histórico de patrimônio para o usuário ID: ${usuarioId} - ${error.message}`);
            return res.status(500).json({ success: false, message: 'Erro ao buscar histórico de patrimônio.' });
        }
    }

}

module.exports = HistoricoPatrimonioController;
