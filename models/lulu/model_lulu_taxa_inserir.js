// models/lulu/model_lulu_taxa_inserir.js
const pool = require('../../database/database_purg');

const LuluTaxaInserirModel = {
    // tipo: 'cartao' | 'pix' | 'pix_automatico'
    // cobrancaCartaoId: obrigatório para cartao, null para pix
    // depositoId: obrigatório para pix/pix_automatico, null para cartao
    async inserir({ usuarioId, cobrancaCartaoId = null, depositoId = null, valorTaxa, tipo = 'cartao' }) {
        const [result] = await pool.promise().execute(
            `INSERT INTO lulu_taxas (usuario_id, cobranca_cartao_id, deposito_id, tipo, valor_taxa)
             VALUES (?, ?, ?, ?, ?)`,
            [usuarioId, cobrancaCartaoId, depositoId, tipo, valorTaxa]
        );
        return result.insertId;
    }
};

module.exports = LuluTaxaInserirModel;
