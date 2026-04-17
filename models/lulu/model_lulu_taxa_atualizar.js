// models/lulu/model_lulu_taxa_atualizar.js
const LuluTaxaAtualizarModel = {
    // Atualiza valor_recuperado e, se quitada, status. Usa conn (dentro de withTransaction).
    async atualizar(taxaId, valorRecuperadoNovo, quitada, conn) {
        await conn.execute(
            `UPDATE lulu_taxas
             SET valor_recuperado = ?,
                 status = ?
             WHERE id = ?`,
            [valorRecuperadoNovo, quitada ? 'Quitada' : 'Ativa', taxaId]
        );
    }
};

module.exports = LuluTaxaAtualizarModel;
