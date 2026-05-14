const connection = require('../../database/database_purg');
const logger = require('../../logger');

const RelatorioGerencialModel = {
    async getDados(data, dataInicio) {
        const query = `
            SELECT
                (SELECT COUNT(*) FROM users WHERE usuario_id != 1)
                    AS total_usuarios,

                (SELECT COUNT(*) FROM users WHERE DATE(created_at) BETWEEN ? AND ? AND usuario_id != 1)
                    AS usuarios_novos,

                (SELECT COUNT(*) FROM carteiras WHERE investido > 0 AND usuario_id != 1 AND status_ativo = 1)
                    AS usuarios_investindo,

                (SELECT COALESCE(SUM(valor_deposito), 0)
                 FROM depositos
                 WHERE DATE(data_criacao) BETWEEN ? AND ?
                   AND status_deposito = 'Executado'
                   AND usuario_id != 1)
                    AS depositos,

                (SELECT COALESCE(SUM(valor_saque), 0)
                 FROM saques
                 WHERE DATE(data_criacao) BETWEEN ? AND ?
                   AND status_saque = 'Executado'
                   AND usuario_id != 1)
                    AS saques,

                (SELECT COUNT(*) FROM saques WHERE status_saque = 'Processando' AND usuario_id != 1)
                    AS saques_pendentes,

                (SELECT COALESCE(SUM(investido), 0) FROM carteiras WHERE status_ativo = 1 AND usuario_id != 1)
                    AS volume_investido
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [dataInicio, data, dataInicio, data, dataInicio, data], (error, results) => {
                if (error) {
                    logger.error('[Webhook] Erro ao buscar relatório gerencial:', error);
                    return reject(new Error('Erro ao buscar dados do relatório.'));
                }
                resolve(results[0]);
            });
        });
    },

    async getProjecao6Meses() {
        const query = `
            SELECT
                DATE_FORMAT(data_limite, '%Y-%m') AS mes,
                SUM(objetivo_investir)            AS total_previsto
            FROM objetivos
            WHERE data_limite BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 MONTH)
              AND status_ativo      = 1
              AND objetivo_completo = 0
            GROUP BY DATE_FORMAT(data_limite, '%Y-%m')
            ORDER BY mes ASC
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [], (error, results) => {
                if (error) {
                    logger.error('[Webhook] Erro ao buscar projeção de 6 meses:', error);
                    return reject(new Error('Erro ao buscar projeção.'));
                }
                resolve(results);
            });
        });
    }
};

module.exports = RelatorioGerencialModel;
