// models/lulu/model_lulu_config_atualizar.js
const pool = require('../../database/database_purg');

const LuluConfigAtualizarModel = {
    async atualizar({ percentualDeducao, taxaCartaoPercentual, percentualDeducaoPix, taxaPixPercentual, taxaPixAutomaticoValor }) {
        await pool.promise().execute(
            `UPDATE lulu_config SET
                percentual_deducao          = ?,
                taxa_cartao_percentual      = ?,
                percentual_deducao_pix      = ?,
                taxa_pix_percentual         = ?,
                taxa_pix_automatico_valor   = ?
             WHERE id = 1`,
            [percentualDeducao, taxaCartaoPercentual, percentualDeducaoPix, taxaPixPercentual, taxaPixAutomaticoValor]
        );
    }
};

module.exports = LuluConfigAtualizarModel;
