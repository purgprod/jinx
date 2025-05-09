// controllers/usuarios/controller_saldos_usuarios.js

const UsuariosSaldosModel = require('../../models/usuarios/model_saldos_usuarios');
const logger = require('../../logger');

class UsuariosSaldosController {

   // Endpoint para obter os saldos totais do usuário
    static async getSaldos(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosSaldos = await UsuariosSaldosModel.getSaldos(usuarioId);
            if (dadosSaldos) {
                res.status(200).json(dadosSaldos);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de saque encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os saldos para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os saldos.' });
        }
    }

}

module.exports = UsuariosSaldosController;

