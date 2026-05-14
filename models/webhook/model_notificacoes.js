const connection = require('../../database/database_purg');
const logger = require('../../logger');

const NotificacoesModel = {
    async criar(usuario_id, tipo, payload) {
        const query = `
            INSERT INTO notificacoes (usuario_id, tipo, payload)
            VALUES (?, ?, ?)
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id, tipo, JSON.stringify(payload)], (error, results) => {
                if (error) {
                    logger.error(`[Nami] Erro ao criar notificação tipo=${tipo} usuario_id=${usuario_id}:`, error);
                    return reject(error);
                }
                resolve(results.insertId);
            });
        });
    },

    async buscarPendentes(limite = 50, prioridade = null) {
        const filtroPrioridade = prioridade ? 'AND n.prioridade = ?' : '';
        const params = prioridade ? [prioridade, limite] : [limite];
        const query = `
            SELECT
                n.id,
                n.data_criacao,
                n.usuario_id,
                n.tipo,
                n.prioridade,
                n.payload,
                n.tentativas,
                u.celular,
                u.apelido
            FROM notificacoes n
            INNER JOIN users u ON n.usuario_id = u.usuario_id
            WHERE n.status = 'pendente'
              AND u.celular IS NOT NULL
              AND u.nami_ativo = 1
              ${filtroPrioridade}
            ORDER BY n.data_criacao ASC
            LIMIT ?
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, params, (error, results) => {
                if (error) {
                    logger.error('[Nami] Erro ao buscar notificações pendentes:', error);
                    return reject(new Error('Erro ao buscar notificações pendentes.'));
                }
                resolve(results.map(r => ({
                    ...r,
                    payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
                })));
            });
        });
    },

    async marcarEnviado(id) {
        const query = `
            UPDATE notificacoes
            SET status = 'enviado', data_envio = NOW()
            WHERE id = ? AND status = 'pendente'
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [id], (error, results) => {
                if (error) {
                    logger.error(`[Nami] Erro ao marcar notificação ${id} como enviada:`, error);
                    return reject(new Error('Erro ao atualizar notificação.'));
                }
                resolve(results.affectedRows);
            });
        });
    },

    async marcarFalhou(id) {
        const query = `
            UPDATE notificacoes
            SET
                tentativas = tentativas + 1,
                status     = CASE WHEN tentativas >= 3 THEN 'falhou' ELSE status END
            WHERE id = ? AND status = 'pendente'
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [id], (error, results) => {
                if (error) {
                    logger.error(`[Nami] Erro ao marcar notificação ${id} como falhou:`, error);
                    return reject(new Error('Erro ao atualizar notificação.'));
                }
                resolve(results.affectedRows);
            });
        });
    },
};

module.exports = NotificacoesModel;
