// models/rotinas/model_poppy_buscar_pins_disponiveis.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarPinsDisponiveisModel = {
    async getPins(riscos) {
        // Verifica se riscos é um array e tem pelo menos um valor
        if (!Array.isArray(riscos) || riscos.length === 0) {
            throw new Error('Os riscos devem ser um array não vazio.');
        }

        // Constrói a cláusula IN dinamicamente
        const risco = riscos.map(() => '?').join(',');
        const sqlQuery = `SELECT u.token_id, u.quantidade_tokens, t.risco
                FROM usuario_tokens u
                INNER JOIN tokens t
                ON u.token_id = t.id_token
                WHERE t.risco IN (${risco})
                AND t.status_ativo = 1
                AND t.flag_sinistro = 0
                AND u.quantidade_tokens > 0
                AND u.usuario_id = 1;`

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, riscos, (error, results) => {
                if (error) {
                    logger.error('Erro ao buscar pins disponíveis:', error);
                    reject(new Error('Erro ao buscar tokens'));
                } else {
                    resolve(results);
                }
            });
        });
    }
};

module.exports = BuscarPinsDisponiveisModel;

