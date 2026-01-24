// controllers/endpoint/controller_deposito_historico_do_usuario.js
const DepositoHistoricoUsuarioModel = require('../../models/endpoints/model_deposito_buscar_historico_do_usuario');
const logger = require('../../logger');

class DepositoHistoricoUsuarioController {

    static async getDepositoHistoricoUsuario(req, res) {
        const { id } = req.params;

        try {
            const dadosDeposito = await DepositoHistoricoUsuarioModel.getHistoricoDepositoUsuario(id);
            
            // Retorno consistente: sempre um array, evitando que o front-end quebre ao tentar iterar
            return res.status(200).json(dadosDeposito);

        } catch (error) {
            logger.error(`Controller Error [getDepositoHistoricoUsuario]: ${error.message}`);
            return res.status(500).json({ 
                error: 'Erro interno ao processar a solicitação de histórico.' 
            });
        }
    }
}

module.exports = DepositoHistoricoUsuarioController;
