// models/model_tokens.js
const connection = require('../database/database_crowdfunding');

const TokensModel = {
    async getTokens() {
        const sqlQuery = 'SELECT * FROM tokens WHERE status_ativo = 1';
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

    async updateTokens(id, data) {
        const sqlQuery = `
            UPDATE tokens
            SET flag_sinistro = ?, data_sinistro = ?, status_ativo = ?
            WHERE id_resultado = ?
        `;
        const values = [
            data.flag_sinistro, data.data_sinistro, data.status_ativo, id
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

module.exports = TokensModel;

