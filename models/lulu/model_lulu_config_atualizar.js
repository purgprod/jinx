// models/lulu/model_lulu_config_atualizar.js
const pool = require('../../database/database_purg');

const LuluConfigAtualizarModel = {
    async atualizar({ percentualDeducao, taxaCartaoPercentual }) {
        await pool.promise().execute(
            'UPDATE lulu_config SET percentual_deducao = ?, taxa_cartao_percentual = ? WHERE id = 1',
            [percentualDeducao, taxaCartaoPercentual]
        );
    }
};

module.exports = LuluConfigAtualizarModel;
