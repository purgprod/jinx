// models/model_resultados_financeiros.js
const connection = require('../database/database_crowdfunding');

const ResultadosFinanceirosModel = {
    async getResultadosFinanceiros() {
        const sqlQuery = 'SELECT * FROM resultados_financeiros WHERE status_ativo = 1';
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, (error, results) => {
                if (error) {
                    reject(error); // Rejeita a Promise se houver erro
                } else {
                    resolve(results); // Resolve a Promise com os resultados
                }
            });
        });
    }
};

module.exports = ResultadosFinanceirosModel;

