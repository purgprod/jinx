const TaxaCdiModel = require('../../models/admin/model_taxa_cdi');
const logger = require('../../logger');

const AdminTaxaCdiController = {
    async get(_req, res) {
        try {
            const row = await TaxaCdiModel.buscar();
            if (!row) return res.status(404).json({ error: 'Taxa CDI não encontrada.' });
            res.json({
                valor: parseFloat(row.valor),
                proxima_reuniao_copom: row.proxima_reuniao_copom ?? null,
                atualizado_em: row.atualizado_em,
            });
        } catch (error) {
            logger.error('[Admin] Erro ao buscar taxa CDI:', error);
            res.status(500).json({ error: 'Erro interno.' });
        }
    },

    async atualizar(req, res) {
        const valor = parseFloat(req.body.valor);
        if (isNaN(valor) || valor < 0 || valor > 100) {
            return res.status(400).json({ error: 'Valor inválido. Informe um percentual entre 0 e 100.' });
        }
        const copom = req.body.proxima_reuniao_copom || null;
        if (copom && !/^\d{4}-\d{2}-\d{2}$/.test(copom)) {
            return res.status(400).json({ error: 'Data da reunião do COPOM inválida. Use o formato YYYY-MM-DD.' });
        }
        try {
            await TaxaCdiModel.atualizar(valor.toFixed(4), copom);
            logger.info(`[Admin] Taxa CDI atualizada para ${valor}% a.a., próxima reunião COPOM: ${copom ?? 'não informada'}`);
            res.json({ success: true, valor, proxima_reuniao_copom: copom });
        } catch (error) {
            logger.error('[Admin] Erro ao atualizar taxa CDI:', error);
            res.status(500).json({ error: 'Erro interno.' });
        }
    },
};

module.exports = AdminTaxaCdiController;
