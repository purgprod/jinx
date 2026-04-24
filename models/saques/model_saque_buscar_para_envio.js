// models/saques/model_saque_buscar_para_envio.js
// Busca o saque "Processando" do usuário com os dados necessários para enviar o Pix.
const connection = require('../../database/database_purg');
const logger = require('../../logger');

const BuscarSaqueParaEnvioModel = {
    /**
     * Retorna o saque pendente (Analisando) do usuário com valor e chave Pix.
     * Utilizado pelo admin no momento de executar o pagamento via Nubank.
     *
     * @param {number|string} usuario_id
     * @returns {Object|null} { id, valor_saque, chave_pix } ou null
     */
    async getSaqueParaEnvio(usuario_id) {
        const query = `
            SELECT id, valor_saque, chave_pix
            FROM saques
            WHERE usuario_id = ?
              AND status_saque = 'Processando'
            ORDER BY data_criacao ASC
            LIMIT 1;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Model] Erro ao buscar saque para envio. usuario_id=${usuario_id}:`, error);
                    return reject(new Error('Erro ao buscar saque pendente.'));
                }
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    }
};

module.exports = BuscarSaqueParaEnvioModel;
