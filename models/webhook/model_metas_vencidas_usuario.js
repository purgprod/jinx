const connection = require('../../database/database_purg');
const logger = require('../../logger');

const MetasVencidasUsuarioModel = {
    async buscarPorUsuario(usuario_id) {
        const query = `
            SELECT
                od.objetivo_descricao          AS objetivo_nome,
                o.objetivo_numero              AS meta_numero,
                o.objetivo_investir            AS valor_meta,
                o.saldo_alocado                AS valor_alocado,
                o.data_limite,
                DATEDIFF(CURDATE(), o.data_limite) AS dias_atraso
            FROM objetivos_descricao od
            INNER JOIN objetivos o
                ON o.objetivo_id = od.objetivo_id
                AND o.status_ativo    = 1
                AND o.objetivo_completo = 0
                AND DATEDIFF(CURDATE(), o.data_limite) > 0
            WHERE od.usuario_id  = ?
              AND od.status_ativo = 1
            ORDER BY od.objetivo_id ASC, o.objetivo_numero ASC
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error('[Webhook] Erro ao buscar metas vencidas do usuário:', error);
                    return reject(new Error('Erro ao buscar metas vencidas.'));
                }
                resolve(results);
            });
        });
    },
};

module.exports = MetasVencidasUsuarioModel;
