const connection = require('../../database/database_purg');
const logger = require('../../logger');

const DadosUsuarioModel = {
    async buscarBase(usuario_id) {
        const query = `
            SELECT
                u.apelido,
                u.cpf,
                u.celular,
                u.pix_cpf,
                u.pix_celular,
                u.pix_email,
                u.pix_chave,
                u.nami_ativo,
                c.saldo,
                c.investido,
                c.pontos,
                c.liga,
                r.posicao
            FROM users u
            LEFT JOIN carteiras c ON c.usuario_id = u.usuario_id
            LEFT JOIN ranking  r ON r.usuario_id = u.usuario_id
            WHERE u.usuario_id = ?
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Webhook] Erro ao buscar base usuario_id=${usuario_id}:`, error);
                    return reject(new Error('Erro ao buscar dados do usuário.'));
                }
                resolve(results[0] || null);
            });
        });
    },

    async buscarObjetivos(usuario_id) {
        const query = `
            SELECT
                od.objetivo_id,
                od.objetivo_descricao,
                od.primeiro_aporte_feito,
                o.objetivo_investir,
                o.data_limite,
                o.objetivo_completo,
                o.saldo_alocado
            FROM objetivos_descricao od
            LEFT JOIN objetivos o
                ON o.objetivo_id = od.objetivo_id
               AND o.status_ativo = 1
            WHERE od.usuario_id = ?
              AND od.status_ativo = 1
            ORDER BY od.objetivo_id ASC, o.objetivo_numero ASC
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Webhook] Erro ao buscar objetivos usuario_id=${usuario_id}:`, error);
                    return reject(new Error('Erro ao buscar objetivos.'));
                }
                resolve(results);
            });
        });
    },

    async buscarTokens(usuario_id) {
        const query = `
            SELECT
                ut.token_id,
                ut.quantidade_tokens,
                ut.rendimento_token,
                t.razao_social,
                t.risco
            FROM usuario_tokens ut
            LEFT JOIN tokens t ON t.id_token = ut.token_id
            WHERE ut.usuario_id = ?
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Webhook] Erro ao buscar tokens usuario_id=${usuario_id}:`, error);
                    return reject(new Error('Erro ao buscar tokens.'));
                }
                resolve(results);
            });
        });
    },

    async buscarDepositos(usuario_id) {
        const query = `
            SELECT data_criacao, valor_deposito, status_deposito, motivo
            FROM depositos
            WHERE usuario_id = ?
            ORDER BY data_criacao DESC
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Webhook] Erro ao buscar depositos usuario_id=${usuario_id}:`, error);
                    return reject(new Error('Erro ao buscar depósitos.'));
                }
                resolve(results);
            });
        });
    },

    async buscarSaques(usuario_id) {
        const query = `
            SELECT data_criacao, valor_saque, chave_pix, status_saque, motivo
            FROM saques
            WHERE usuario_id = ?
            ORDER BY data_criacao DESC
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Webhook] Erro ao buscar saques usuario_id=${usuario_id}:`, error);
                    return reject(new Error('Erro ao buscar saques.'));
                }
                resolve(results);
            });
        });
    },

    async buscarRendimentosMensais(usuario_id) {
        const query = `
            SELECT
                DATE_FORMAT(data_criacao, '%Y-%m') AS mes,
                SUM(rendimento_dia)                AS rendimento_mensal
            FROM usuarios_dados_financeiros_diarios
            WHERE usuario_id = ?
            GROUP BY mes
            ORDER BY mes ASC
        `;
        return new Promise((resolve, reject) => {
            connection.query(query, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`[Webhook] Erro ao buscar rendimentos mensais usuario_id=${usuario_id}:`, error);
                    return reject(new Error('Erro ao buscar rendimentos mensais.'));
                }
                resolve(results);
            });
        });
    },
};

module.exports = DadosUsuarioModel;
