// controllers/endpoint/controller_saque_historico_do_usuario.js
const SaqueHistoricoUsuarioModel = require('../../models/endpoints/model_saque_buscar_historico_do_usuario');
const logger = require('../../logger');

class SaqueHistoricoUsuarioController {

    static async getSaqueHistoricoUsuario(req, res) {
        const { id } = req.params;

        try {
            const dadosSaque = await SaqueHistoricoUsuarioModel.getHistoricoSaqueUsuario(id);
            
            // Retorno consistente: sempre um array, evitando que o front-end quebre ao tentar iterar
            return res.status(200).json(dadosSaque);

        } catch (error) {
            logger.error(`Controller Error [getSaqueHistoricoUsuario]: ${error.message}`);
            return res.status(500).json({ 
                error: 'Erro interno ao processar a solicitação de histórico.' 
            });
        }
    }
}

module.exports = SaqueHistoricoUsuarioController;
