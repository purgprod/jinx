const connection = require('../../database/database_purg');
const logger = require('../../logger');

const VerificarMetasMensaisModel = {
    // Retorna todos os usuários ativos que têm metas com prazo no mês atual ainda incompletas,
    // agrupando todas as metas pendentes de cada usuário em um array.
    async buscarUsuariosComMetasIncompletas() {
        const query = `
            SELECT
                u.usuario_id,
                u.celular,
                od.objetivo_id,
                od.objetivo_descricao  AS objetivo_nome,
                o.objetivo_numero      AS meta_numero,
                o.objetivo_investir    AS valor_meta,
                o.saldo_alocado        AS valor_alocado,
                o.data_limite
            FROM users u
            INNER JOIN objetivos_descricao od
                ON od.usuario_id = u.usuario_id
                AND od.status_ativo = 1
            INNER JOIN objetivos o
                ON o.objetivo_id = od.objetivo_id
                AND o.status_ativo = 1
                AND o.objetivo_completo = 0
                AND DATEDIFF(CURDATE(), o.data_limite) IN (1, 5, 10, 20, 29)
            WHERE u.status_ativo = 1
              AND u.nami_ativo = 1
              AND u.celular IS NOT NULL
            ORDER BY u.usuario_id ASC, od.objetivo_id ASC, o.objetivo_numero ASC
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    logger.error('[Nami] Erro ao buscar metas mensais incompletas:', error);
                    return reject(new Error('Erro ao buscar metas mensais.'));
                }
                resolve(results);
            });
        });
    },

    // Verifica se o usuário já recebeu notificação de meta_mensal_incompleta hoje,
    // para evitar duplicatas se o endpoint for chamado mais de uma vez no mesmo dia.
    async jaNotificadoHoje(usuario_id) {
        const query = `
            SELECT COUNT(*) AS total
            FROM notificacoes
            WHERE usuario_id = ?
              AND tipo = 'meta_mensal_incompleta'
              AND DATE(data_criacao) = CURDATE()
              AND status IN ('pendente', 'enviado')
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) return reject(error);
                resolve(Number(results[0].total) > 0);
            });
        });
    },
};

module.exports = VerificarMetasMensaisModel;
