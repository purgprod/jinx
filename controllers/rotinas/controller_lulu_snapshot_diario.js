// controllers/rotinas/controller_lulu_snapshot_diario.js
// Grava um snapshot diário dos totais da Lulu para alimentar os gráficos do painel Jinx.
// Executa ao final da cadeia diária, após todas as amortizações do dia.

const logger = require('../../logger');
const LuluResumoModel   = require('../../models/lulu/model_lulu_resumo');
const LuluHistoricoModel = require('../../models/lulu/model_lulu_historico');

const LuluSnapshotDiarioController = {
    async executarSnapshot(req, res) {
        res.status(200).json({ message: 'Rotinas executadas com sucesso' });

        try {
            const resumo = await LuluResumoModel.getResumo();
            const hoje   = new Date().toISOString().slice(0, 10);

            await LuluHistoricoModel.inserirOuAtualizar(
                hoje,
                resumo.total_pendente,
                resumo.total_usuarios
            );

            logger.info(`[Lulu] Snapshot gravado. data=${hoje}, pendente=${resumo.total_pendente}, usuários=${resumo.total_usuarios}`);
        } catch (err) {
            logger.error('[Lulu] Erro ao gravar snapshot diário.', { erro: err.message });
        }
    }
};

module.exports = LuluSnapshotDiarioController;
