//dados/jinx/models/rotinas/model_poppy_converter_emblemas_em_saldo.js

const mysql = require('mysql2');
const pool = require('../../database/database_purg');
const logger = require('../../logger');

const ConverterEmblemasModel = {
    async converterEmblemas(usuario_id, saldoAtualizado ) {
        const sql = `UPDATE carteiras
			SET emblemas = 0, saldo = ?
			WHERE usuario_id = ?`;
        
        return new Promise((resolve, reject) => {
            pool.promise().execute(sql, [saldoAtualizado, usuario_id])
                .then((results) => {
                    logger.info(`Usuário ${usuario_id} teve os Emblemas convertidos para o saldo`);
                    resolve(results);
                })
                .catch((error) => {
                    logger.error(`Erro ao converter os Emblemas do usuário ${usuario_id}`, error);
                    reject(new Error(`Erro ao converter os Emblemas do usuário ${usuario_id}`));
                });
        });
    }
};

module.exports = ConverterEmblemasModel;

