// controllers/usuarios/controller_liga_usuario.js

const BuscarLigaUsuarioModel = require('../../models/usuarios/model_buscar_liga');
const logger = require('../../logger');

class LigaUsuarioController {

    static async getLiga(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosLiga = await BuscarLigaUsuarioModel.obterLigaUsuario(usuarioId);
            if (dadosLiga) {
                res.status(200).json(dadosLiga);
            } else {
                res.status(404).json({ message: 'Nenhum dado de liga encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar a liga para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar a liga.' });
        }
    }

}

module.exports = LigaUsuarioController;
