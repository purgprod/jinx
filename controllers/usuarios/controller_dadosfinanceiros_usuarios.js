// controllers/usuarios/controller_dadosfinanceiros_usuarios.js

const UsuariosUltimosDadosFinanceirosModel = require('../../models/usuarios/model_ultimosdadosfinanceiros_usuarios');
const logger = require('../../logger');

class UsuariosDadosFinanceirosController {

    // Endpoint para obter os últimos dados financeiros
    static async getUltimosDadosFinanceiros(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosFinanceiros = await UsuariosUltimosDadosFinanceirosModel.getUltimosDadosFinanceiros(usuarioId);
            if (dadosFinanceiros) {
                res.status(200).json(dadosFinanceiros);
            } else {
                res.status(404).json({ message: 'Nenhum dado financeiro encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar últimos dados financeiros para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar últimos dados financeiros.' });
        }
    }
}

module.exports = UsuariosDadosFinanceirosController;

