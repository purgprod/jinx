const TaxaCdiModel = require('../../models/admin/model_taxa_cdi');
const logger = require('../../logger');

const ProximaReuniaoCopomController = {
    async get(_req, res) {
        try {
            const row = await TaxaCdiModel.buscar();
            if (!row) return res.status(404).json({ error: 'Dados não encontrados.' });
            res.json({ proxima_reuniao_copom: row.proxima_reuniao_copom ?? null });
        } catch (error) {
            logger.error('[Webhook] Erro ao buscar próxima reunião COPOM:', error);
            res.status(500).json({ error: 'Erro interno.' });
        }
    },
};

module.exports = ProximaReuniaoCopomController;
