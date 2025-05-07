// controllers/usuarios/controller_ranking_usuario.js

const PerfilRankingModel = require('../../models/usuarios/model_buscar_ranking');
const logger = require('../../logger');

class PerfilRankingController {

    // Endpoint para obter o ranking completo dos usuários
    static async getRanking(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosRanking = await PerfilRankingModel.obterRankingUsuario(usuarioId);
            if (dadosRanking) {
                res.status(200).json(dadosRanking);
            } else {
                res.status(404).json({ message: 'Nenhum dado de ranking encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os ranking para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os ranking.' });
        }
    }

}

module.exports = PerfilRankingController;

