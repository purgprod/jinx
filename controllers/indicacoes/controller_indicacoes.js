// controllers/indicacoes/controller_indicacoes.js

const IndicacoesModel = require('../../models/indicacoes/model_indicacoes');
const logger          = require('../../logger');

async function buscarMinhasIndicacoes(req, res) {
    const usuarioId       = req.session.user.id;
    const codigoIndicacao = req.session.user.codigo_indicacao;

    if (!codigoIndicacao) {
        return res.status(500).json({ success: false, message: 'Código de indicação não encontrado.' });
    }

    try {
        const total = await IndicacoesModel.contarIndicadosPorIndicador(usuarioId);

        return res.status(200).json({
            success: true,
            codigo_indicacao: codigoIndicacao,
            link: `https://purg.com.br/cadastro?ref=${codigoIndicacao}`,
            total_indicados: total,
        });

    } catch (err) {
        logger.error(`Erro ao buscar indicações do usuário ${usuarioId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { buscarMinhasIndicacoes };
