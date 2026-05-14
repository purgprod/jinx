// models/depositos/model_deposito_buscar_por_txid.js
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarDepositoPorTxidModel = {
    /**
     * Busca um depósito pelo txid do Nubank.
     * Utilizado no webhook para identificar qual depósito está sendo confirmado.
     *
     * @param {string} txid - Identificador único da cobrança Pix
     * @returns {Object|null} Registro do depósito ou null
     */
    async temDepositoRecenteExecutado(usuarioId, minutos = 10) {
        const query = `
            SELECT 1 FROM depositos
            WHERE usuario_id = ?
              AND status_deposito = 'Executado'
              AND data_status >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
            LIMIT 1
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuarioId, minutos], (error, results) => {
                if (error) {
                    logger.error(`[Model Deposito] Erro ao verificar depósito recente para usuario_id=${usuarioId}:`, error);
                    return reject(new Error('Erro ao verificar depósito recente.'));
                }
                resolve(results.length > 0);
            });
        });
    },

    async getDepositoPorTxid(txid) {
        const query = `
            SELECT
                d.id,
                d.usuario_id,
                d.valor_deposito,
                d.txid,
                d.status_deposito,
                u.cpf,
                u.nome_completo
            FROM depositos d
            INNER JOIN users u ON u.usuario_id = d.usuario_id
            WHERE d.txid = ?
            LIMIT 1;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [txid], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao buscar depósito por txid=${txid}:`, error);
                    return reject(new Error('Erro ao buscar depósito por txid.'));
                }
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    }
};

module.exports = BuscarDepositoPorTxidModel;
