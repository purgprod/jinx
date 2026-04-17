// models/lulu/model_lulu_taxa_inserir.js
const pool = require('../../database/database_purg');

const LuluTaxaInserirModel = {
    async inserir({ usuarioId, cobrancaCartaoId, valorTaxa }) {
        const [result] = await pool.promise().execute(
            `INSERT INTO lulu_taxas (usuario_id, cobranca_cartao_id, valor_taxa)
             VALUES (?, ?, ?)`,
            [usuarioId, cobrancaCartaoId, valorTaxa]
        );
        return result.insertId;
    }
};

module.exports = LuluTaxaInserirModel;
