// controllers/usuarios/controller_rendimentos_usuarios.js

const UsuariosRendimentosModel = require('../../models/usuarios/model_rendimentos_usuarios');
const logger = require('../../logger');

class UsuariosRendimentosController {

   // Endpoint para obter os saques totais do usuário
    static async getRendimentos(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosRendimentos = await UsuariosRendimentosModel.getRendimentos(usuarioId);
            if (dadosRendimentos) {
                res.status(200).json(dadosRendimentos);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de rendimentos encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os rendimentos para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os rendimentos.' });
        }
    }

}

module.exports = UsuariosRendimentosController;

