const connection = require('../../database/database_purg');
const logger = require('../../logger');

const MetaVencidaModel = {
    // Retorna todos os usuários ativos com metas incompletas há mais de 10 dias
    // após a data_limite, agrupando todas as metas vencidas de cada usuário.
    async buscarMetasVencidas() {
        const query = `
            SELECT
                u.usuario_id,
                u.celular,
                od.objetivo_descricao  AS objetivo_nome,
                o.objetivo_numero      AS meta_numero,
                o.objetivo_investir    AS valor_meta,
                o.saldo_alocado        AS valor_alocado,
                o.data_limite,
                DATEDIFF(CURDATE(), o.data_limite) AS dias_atraso
            FROM users u
            INNER JOIN objetivos_descricao od
                ON od.usuario_id = u.usuario_id
                AND od.status_ativo = 1
            INNER JOIN objetivos o
                ON o.objetivo_id = od.objetivo_id
                AND o.status_ativo = 1
                AND o.objetivo_completo = 0
                AND DATEDIFF(CURDATE(), o.data_limite) > 10
            WHERE u.status_ativo = 1
              AND u.nami_ativo = 1
              AND u.celular IS NOT NULL
            ORDER BY u.usuario_id ASC, od.objetivo_id ASC, o.objetivo_numero ASC
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    logger.error('[Nami] Erro ao buscar metas vencidas:', error);
                    return reject(new Error('Erro ao buscar metas vencidas.'));
                }
                resolve(results);
            });
        });
    },

    // Evita reenvio: retorna true se o usuário já recebeu meta_vencida nos últimos 30 dias.
    async jaFoiNotificado(usuario_id) {
        const query = `
            SELECT COUNT(*) AS total
            FROM notificacoes
            WHERE usuario_id = ?
              AND tipo = 'meta_vencida'
              AND status IN ('pendente', 'enviado')
              AND data_criacao >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) return reject(error);
                resolve(Number(results[0].total) > 0);
            });
        });
    },
};

module.exports = MetaVencidaModel;
