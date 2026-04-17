// models/lulu/model_lulu_deducao_inserir.js
const LuluDeducaoInserirModel = {
    // Usa conn (dentro de withTransaction).
    async inserir(taxaId, usuarioId, valorDeduzido, conn) {
        await conn.execute(
            `INSERT INTO lulu_deducoes (taxa_id, usuario_id, valor_deduzido)
             VALUES (?, ?, ?)`,
            [taxaId, usuarioId, valorDeduzido]
        );
    }
};

module.exports = LuluDeducaoInserirModel;
