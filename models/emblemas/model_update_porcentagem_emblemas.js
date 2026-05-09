// models/emblemas/model_update_porcentagem_emblemas.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const UpdatePorcentagemEmblemasModel = {

    async updatePorcentagem(novoValor) {
        const sqlQuery = `UPDATE porcentagem_emblemas SET porcentagem_emblemas = ? WHERE id = 1`;
        logger.info(`Iniciando alteração da porcentagem dos emblemas para: ${novoValor}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [novoValor], (error, results) => {
                if (error) {
                    logger.error(`Erro ao alterar a porcentagem das emblemas para: ${novoValor} - ${error.message}`);
                    reject(new Error(`Erro ao inativar token com ID: ${novoValor}`));
		} else {
                    if (results.affectedRows > 0) {
		    } else {
                        logger.warn(`A porcentagem dos emblemas não foi alterada para o novo valor: ${novoValor}`);
		    }
                    resolve(results);
                }
            });
        });
    },

    async updatePorcentagemTx(novoValor, conn) {
        const [result] = await conn.execute(
            'UPDATE porcentagem_emblemas SET porcentagem_emblemas = ? WHERE id = 1',
            [novoValor]
        );
        return result;
    },

    async updateJurosEMBTx(novoValor, conn) {
        const [result] = await conn.execute(
            "UPDATE resultados_financeiros SET juros_a_a = ? WHERE risco = 'EMB'",
            [novoValor]
        );
        return result;
    },

    async updateTaxaIrTx(novaTaxaIr, conn) {
        const [result] = await conn.execute(
            'UPDATE porcentagem_emblemas SET taxa_ir = ? WHERE id = 1',
            [novaTaxaIr]
        );
        return result;
    },

    // Atualiza tokens.rendimento_token para todos os EMB (campo visual — não usado no pagamento)
    async updateRendimentoTokenEMBTx(rendimentoDiario, conn) {
        const [result] = await conn.execute(
            "UPDATE tokens SET rendimento_token = ? WHERE risco = 'EMB'",
            [rendimentoDiario]
        );
        return result;
    },

    // Atualiza resultados_financeiros.ir para todos os EMB (campo visual)
    async updateIrRFEMBTx(irPercentual, conn) {
        const [result] = await conn.execute(
            "UPDATE resultados_financeiros SET ir = ? WHERE risco = 'EMB'",
            [irPercentual]
        );
        return result;
    }
};

module.exports = UpdatePorcentagemEmblemasModel;

