// controllers/lulu/controller_lulu_dashboard.js
// Endpoints do painel Lulu na Jinx.

const logger                 = require('../../logger');
const LuluResumoModel        = require('../../models/lulu/model_lulu_resumo');
const LuluHistoricoModel     = require('../../models/lulu/model_lulu_historico');
const LuluTop10Model         = require('../../models/lulu/model_lulu_top10');
const LuluConfigBuscarModel  = require('../../models/lulu/model_lulu_config_buscar');
const LuluConfigAtualizarModel = require('../../models/lulu/model_lulu_config_atualizar');

const LuluDashboardController = {

    async getResumo(req, res) {
        try {
            const resumo = await LuluResumoModel.getResumo();
            res.json(resumo);
        } catch (err) {
            logger.error('[Lulu] Erro ao buscar resumo.', { erro: err.message });
            res.status(500).json({ error: 'Erro ao buscar resumo.' });
        }
    },

    async getHistorico(req, res) {
        try {
            const dias     = Math.min(parseInt(req.query.dias || '30', 10), 365);
            const historico = await LuluHistoricoModel.getHistorico(dias);
            res.json(historico);
        } catch (err) {
            logger.error('[Lulu] Erro ao buscar histórico.', { erro: err.message });
            res.status(500).json({ error: 'Erro ao buscar histórico.' });
        }
    },

    async getTop10(req, res) {
        try {
            const top10 = await LuluTop10Model.getTop10();
            res.json(top10);
        } catch (err) {
            logger.error('[Lulu] Erro ao buscar top 10.', { erro: err.message });
            res.status(500).json({ error: 'Erro ao buscar top 10.' });
        }
    },

    async getConfig(req, res) {
        try {
            const config = await LuluConfigBuscarModel.getConfig();
            res.json(config);
        } catch (err) {
            logger.error('[Lulu] Erro ao buscar config.', { erro: err.message });
            res.status(500).json({ error: 'Erro ao buscar configuração.' });
        }
    },

    async updateConfig(req, res) {
        const {
            percentual_deducao,
            taxa_cartao_percentual,
            percentual_deducao_pix,
            taxa_pix_percentual,
            taxa_pix_automatico_valor,
        } = req.body;

        const p    = parseFloat(percentual_deducao);
        const t    = parseFloat(taxa_cartao_percentual);
        const pp   = parseFloat(percentual_deducao_pix);
        const tp   = parseFloat(taxa_pix_percentual);
        const tpa  = parseFloat(taxa_pix_automatico_valor);

        if (isNaN(p)  || p  <= 0 || p  > 100) return res.status(400).json({ error: 'percentual_deducao inválido (0-100).' });
        if (isNaN(t)  || t  <= 0 || t  > 100) return res.status(400).json({ error: 'taxa_cartao_percentual inválida (0-100).' });
        if (isNaN(pp) || pp <= 0 || pp > 100) return res.status(400).json({ error: 'percentual_deducao_pix inválido (0-100).' });
        if (isNaN(tp) || tp <= 0 || tp > 100) return res.status(400).json({ error: 'taxa_pix_percentual inválida (0-100).' });
        if (isNaN(tpa) || tpa <= 0)            return res.status(400).json({ error: 'taxa_pix_automatico_valor inválido.' });

        try {
            await LuluConfigAtualizarModel.atualizar({
                percentualDeducao:        p.toFixed(2),
                taxaCartaoPercentual:     t.toFixed(2),
                percentualDeducaoPix:     pp.toFixed(2),
                taxaPixPercentual:        tp.toFixed(2),
                taxaPixAutomaticoValor:   tpa.toFixed(2),
            });
            logger.info(`[Lulu] Config atualizada. percentual_cartao=${p}, taxa_cartao=${t}, percentual_pix=${pp}, taxa_pix=${tp}, taxa_pix_auto=${tpa}`);
            res.json({ message: 'Configuração atualizada com sucesso.' });
        } catch (err) {
            logger.error('[Lulu] Erro ao atualizar config.', { erro: err.message });
            res.status(500).json({ error: 'Erro ao atualizar configuração.' });
        }
    }
};

module.exports = LuluDashboardController;
