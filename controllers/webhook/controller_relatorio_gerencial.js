const RelatorioGerencialModel = require('../../models/webhook/model_relatorio_gerencial');
const logger = require('../../logger');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const RelatorioGerencialController = {
    async getRelatorio(req, res) {
        const dataParam = req.query.data;
        const data = dataParam && DATE_REGEX.test(dataParam)
            ? dataParam
            : new Date().toISOString().slice(0, 10);

        const diasParam = parseInt(req.query.dias);
        const dias = diasParam > 0 ? diasParam : 7;

        const dataInicio = new Date(data + 'T12:00:00Z');
        dataInicio.setDate(dataInicio.getDate() - (dias - 1));
        const dataInicioStr = dataInicio.toISOString().slice(0, 10);

        try {
            const [dados, projecao] = await Promise.all([
                RelatorioGerencialModel.getDados(data, dataInicioStr),
                RelatorioGerencialModel.getProjecao6Meses(),
            ]);

            const depositos = parseFloat(dados.depositos);
            const saques    = parseFloat(dados.saques);

            res.json({
                data_referencia: data,
                data_inicio:     dataInicioStr,
                periodo_dias:    dias,
                usuarios: {
                    total:      parseInt(dados.total_usuarios),
                    novos:      parseInt(dados.usuarios_novos),
                    investindo: parseInt(dados.usuarios_investindo),
                },
                financeiro: {
                    depositos:        depositos,
                    saques:           saques,
                    delta:            parseFloat((depositos - saques).toFixed(2)),
                    saques_pendentes: parseInt(dados.saques_pendentes),
                    volume_investido: parseFloat(dados.volume_investido),
                },
                projecao_6_meses: projecao.map(r => ({
                    mes:             r.mes,
                    total_previsto:  parseFloat(r.total_previsto),
                })),
            });

            logger.info(`[Webhook] Relatório gerencial gerado para ${data} (${dias} dias)`);
        } catch (error) {
            logger.error('[Webhook] Erro no controller de relatório gerencial:', error);
            res.status(500).json({ error: 'Erro interno ao gerar relatório.' });
        }
    }
};

module.exports = RelatorioGerencialController;
