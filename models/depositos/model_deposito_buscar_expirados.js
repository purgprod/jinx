const pool = require('../../database/database_purg');

const DepositoBuscarExpiradosModel = {
    async buscarExpirados() {
        const [rows] = await pool.promise().execute(
            `SELECT id, usuario_id
             FROM depositos
             WHERE status_deposito = 'Processando'
               AND txid IS NOT NULL
               AND data_criacao <= DATE_SUB(NOW(), INTERVAL 60 MINUTE)`
        );
        return rows;
    },
};

module.exports = DepositoBuscarExpiradosModel;
