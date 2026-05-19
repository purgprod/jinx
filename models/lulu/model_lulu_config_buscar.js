// models/lulu/model_lulu_config_buscar.js
const pool = require('../../database/database_purg');

const LuluConfigBuscarModel = {
    async getConfig() {
        const [rows] = await pool.promise().execute(
            `SELECT percentual_deducao, taxa_cartao_percentual,
                    percentual_deducao_pix, taxa_pix_percentual, taxa_pix_automatico_valor,
                    atualizado_em
             FROM lulu_config WHERE id = 1`
        );
        return rows[0] ?? null;
    }
};

module.exports = LuluConfigBuscarModel;
