// models/model_resultados_financeiros.js
const connection = require('../database/database_crowdfunding');

const ResultadosFinanceirosModel = {
    async getResultadosFinanceiros() {
        const sqlQuery = 'SELECT * FROM resultados_financeiros WHERE status_ativo = 1';
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    },

    async updateResultadoFinanceiro(id, data) {
        const sqlQuery = `
            UPDATE resultados_financeiros
            SET razao_social = ?, cnpj = ?, tipo_de_sociedade = ?, cnae_principal = ?, capital_social = ?, 
                data_de_fundacao = ?, valor_financiamento_total = ?, valor_financiado_purg = ?, juros_a_a = ?, 
                vencimento = ?, risco = ?, prazo = ?, resultado_financeiro = ?, motivo_da_captacao = ?, 
                descritivo = ?, garantias_oferecidas = ?, historico_com_nexoos = ?, capital_e_capacidade = ?, 
                carater = ?, credito = ?, condicoes = ?, conexoes = ?, colateral = ?, controle = ?, 
                crescimento_12_meses = ?, perfil_das_receitas = ?, site = ?, facebook = ?, instagram = ?, 
                cobertura_sinistro = ?, flag_sinistro = ?, data_sinistro = ?, status_ativo = ?
            WHERE id_resultado = ?
        `;
        const values = [
            data.razao_social, data.cnpj, data.tipo_de_sociedade, data.cnae_principal, data.capital_social,
            data.data_de_fundacao, data.valor_financiamento_total, data.valor_financiado_purg, data.juros_a_a,
            data.vencimento, data.risco, data.prazo, data.resultado_financeiro, data.motivo_da_captacao,
            data.descritivo, data.garantias_oferecidas, data.historico_com_nexoos, data.capital_e_capacidade,
            data.carater, data.credito, data.condicoes, data.conexoes, data.colateral, data.controle,
            data.crescimento_12_meses, data.perfil_das_receitas, data.site, data.facebook, data.instagram,
            data.cobertura_sinistro, data.flag_sinistro, data.data_sinistro, data.status_ativo, id
        ];

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, values, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = ResultadosFinanceirosModel;

