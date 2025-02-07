// controllers/usuarios/controller_saques_usuarios.js

const UsuariosSaquesModel = require('../../models/usuarios/model_saques_usuarios');
const logger = require('../../logger');

class UsuariosSaquesController {

   // Endpoint para obter os saques totais do usuário
    static async getSaques(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosSaques = await UsuariosSaquesModel.getSaques(usuarioId);
            if (dadosSaques) {
                res.status(200).json(dadosSaques);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de saque encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os saques para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os saques.' });
        }
    }

}

module.exports = UsuariosSaquesController;

