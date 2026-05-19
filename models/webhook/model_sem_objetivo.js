const connection = require('../../database/database_purg');
const logger = require('../../logger');

const SemObjetivoModel = {
    // Retorna usuários ativos cadastrados há pelo menos 1 dia que nunca criaram nenhum objetivo.
    async buscarUsuariosSemObjetivo() {
        const query = `
            SELECT u.usuario_id, u.apelido
            FROM users u
            WHERE u.status_ativo = 1
              AND u.nami_ativo   = 1
              AND u.celular IS NOT NULL
              AND DATEDIFF(CURDATE(), DATE(u.data_criacao)) >= 1
              AND NOT EXISTS (
                  SELECT 1
                  FROM objetivos_descricao od
                  WHERE od.usuario_id  = u.usuario_id
                    AND od.status_ativo = 1
              )
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    logger.error('[Nami] Erro ao buscar usuários sem objetivo:', error);
                    return reject(new Error('Erro ao buscar usuários sem objetivo.'));
                }
                resolve(results);
            });
        });
    },

    // Evita reenvio: retorna true se o usuário já recebeu sem_objetivo nos últimos 3 dias.
    async jaFoiNotificadoRecentemente(usuario_id) {
        const query = `
            SELECT COUNT(*) AS total
            FROM notificacoes
            WHERE usuario_id  = ?
              AND tipo        = 'sem_objetivo'
              AND status      IN ('pendente', 'enviado')
              AND data_criacao >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) return reject(error);
                resolve(Number(results[0].total) > 0);
            });
        });
    },
};

module.exports = SemObjetivoModel;
