// controllers/usuarios/controller_depositos_usuarios.js

const UsuariosDepositosModel = require('../../models/usuarios/model_depositos_usuarios');
const logger = require('../../logger');

class UsuariosDepositosController {

   // Endpoint para obter os saques totais do usuário
    static async getDepositos(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosDepositos = await UsuariosDepositosModel.getDepositos(usuarioId);
            if (dadosDepositos) {
                res.status(200).json(dadosDepositos);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de deposito encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os depositos para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os depositos.' });
        }
    }

}

module.exports = UsuariosDepositosController;

