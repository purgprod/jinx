const connection = require('../../database/database_purg');
const logger = require('../../logger');

const RotinasInativarResultadosFinanceirosModel = {
    async inativarResultadosFinanceiros(id_resultado) {
        const sqlQuery = `UPDATE resultados_financeiros 
                SET status_ativo = 0 
                WHERE id_resultado = ?;`;
        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [id_resultado], (error, results) => {
                if (error) {
                    logger.error('Erro ao inativar o Resultado Financeiro:', error);
                    reject(new Error('Erro ao atualizar última execução'));
                } else {
                    logger.info(`Rotina de inativação realizada com sucesso para o Resultado Financeiro: ${id_resultado}`);
                    resolve(results);
                }
            });
        });
    }
};

module.exports = RotinasInativarResultadosFinanceirosModel;

