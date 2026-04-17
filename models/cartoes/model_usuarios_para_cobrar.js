// models/cartoes/model_usuarios_para_cobrar.js
// Retorna usuários elegíveis para cobrança mensal no cartão:
//   • Ativos, com cartão ativo cadastrado
//   • Com ao menos um objetivo ativo e não concluído
//   • Sem cobrança Aprovada ou Processando no mês corrente
const pool = require('../../database/database_purg');

const UsuariosParaCobrarModel = {
    async getUsuariosParaCobrar() {
        const [rows] = await pool.promise().execute(
            `SELECT
                u.usuario_id,
                u.nome_completo,
                u.cpf,
                u.email,
                DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS nascimento,
                u.celular,
                u.logradouro,
                u.numero_da_rua,
                u.complemento,
                u.bairro,
                u.cep,
                u.cidade,
                u.estado,
                cu.payment_token,
                cu.bandeira,
                SUM(o.objetivo_investir)                   AS valor_total
             FROM users u
             INNER JOIN cartoes_usuario cu
                     ON cu.usuario_id = u.usuario_id AND cu.ativo = 1
             INNER JOIN objetivos o
                     ON o.usuario_id = u.usuario_id
                    AND o.status_ativo = 1
                    AND o.objetivo_completo = 0
             LEFT JOIN cobrancas_cartao cc
                    ON cc.usuario_id = u.usuario_id
                   AND cc.status IN ('Aprovada', 'Processando')
                   AND YEAR(cc.referencia_mes)  = YEAR(CURDATE())
                   AND MONTH(cc.referencia_mes) = MONTH(CURDATE())
             WHERE u.status_ativo = 1
               AND cc.id IS NULL
             GROUP BY
                u.usuario_id, u.nome_completo, u.cpf, u.email, u.data_nascimento,
                u.celular, u.logradouro, u.numero_da_rua, u.complemento, u.bairro,
                u.cep, u.cidade, u.estado, cu.payment_token, cu.bandeira
             HAVING valor_total > 0`
        );
        return rows;
    }
};

module.exports = UsuariosParaCobrarModel;
