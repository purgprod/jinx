// controllers/indicacoes/controller_dados_indicacao.js

const pool   = require('../../database/database_purg');
const logger = require('../../logger');

async function getDadosIndicacao(req, res) {
    const usuarioId = parseInt(req.params.usuario_id, 10);

    try {
        const [rows] = await pool.promise().execute(
            `SELECT
                u.codigo_indicacao,
                c.pontos_indicacao,
                i.indicado_id,
                u2.nome_completo AS nome_indicado
             FROM users u
             JOIN carteiras c ON c.usuario_id = u.usuario_id
             LEFT JOIN indicacoes i ON i.indicador_id = u.usuario_id
             LEFT JOIN users u2 ON u2.usuario_id = i.indicado_id
             WHERE u.usuario_id = ?`,
            [usuarioId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        const { codigo_indicacao, pontos_indicacao } = rows[0];

        const indicados = rows
            .filter(r => r.indicado_id !== null)
            .map(r => ({ indicado_id: r.indicado_id, nome_completo: r.nome_indicado }));

        return res.status(200).json({
            success: true,
            codigo_indicacao,
            pontos_indicacao,
            indicados,
        });

    } catch (err) {
        logger.error(`Erro ao buscar dados de indicação do usuário ${usuarioId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { getDadosIndicacao };
