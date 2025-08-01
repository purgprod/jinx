// models/resultados_financeiros/model_update_resultados_financeiros.js
const connection = require('../../database/database_crowdfunding');
const logger = require('../../logger'); // Importa o logger

const ResultadosFinanceirosUpdateModel = {

    async updateResultadoFinanceiro(id, data) {
        const sqlQuery = `
            UPDATE resultados_financeiros
            SET razao_social = ?, cnpj = ?, tipo_de_sociedade = ?, cnae_principal = ?, capital_social = ?,
                data_de_fundacao = ?, valor_financiamento_total = ?, valor_financiado_purg = ?, juros_a_a = ?,
                vencimento = ?, risco = ?, prazo = ?, resultado_financeiro = ?, ir = ?, motivo_da_captacao = ?,
                descritivo = ?, garantias_oferecidas = ?, historico_com_nexoos = ?, capital_e_capacidade = ?,
                carater = ?, credito = ?, condicoes = ?, conexoes = ?, colateral = ?, controle = ?,
                crescimento_12_meses = ?, perfil_das_receitas = ?, site = ?, facebook = ?, instagram = ?, 
		pre_venda = ?, data_pre_venda = ?, cobertura_sinistro = ?, flag_sinistro = ?, data_sinistro = ?
            WHERE id_resultado = ?
        `;
        const values = [
            data.razao_social, data.cnpj, data.tipo_de_sociedade, data.cnae_principal, data.capital_social,
            data.data_de_fundacao, data.valor_financiamento_total, data.valor_financiado_purg, data.juros_a_a,
            data.vencimento, data.risco, data.prazo, data.resultado_financeiro, data.ir, data.motivo_da_captacao,
            data.descritivo, data.garantias_oferecidas, data.historico_com_nexoos, data.capital_e_capacidade,
            data.carater, data.credito, data.condicoes, data.conexoes, data.colateral, data.controle,
            data.crescimento_12_meses, data.perfil_das_receitas, data.site, data.facebook, data.instagram,
            data.pre_venda, data.data_pre_venda, data.cobertura_sinistro, data.flag_sinistro, data.data_sinistro, id
        ];

        logger.info(`Executando update para resultado financeiro com ID: ${id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, values, (error, results) => {
                if (error) {
                    logger.error(`Erro ao atualizar resultado financeiro com ID: ${id} - ${error.message}`);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
		    reject(error);
                } else {
                    logger.info(`Resultado financeiro com ID: ${id} atualizado com sucesso.`);
                    logger.info(`Resposta: ${JSON.stringify(results)}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = ResultadosFinanceirosUpdateModel;

