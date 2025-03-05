// controllers/ecossistema/controller_depositos_ecossistema.js

const EcossistemaDepositosModel = require('../../models/ecossistema/model_depositos_ecossistema');
const logger = require('../../logger');

class EcossistemaDepositosController {

   // Endpoint para obter os depositos totais do ecossistema
    static async getDepositos(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosDepositos = await EcossistemaDepositosModel.getDepositos(usuarioId);
            if (dadosDepositos) {
                res.status(200).json(dadosDepositos);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de deposito encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os depositos para o ecossistema: ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os depositos.' });
        }
    }

}

module.exports = EcossistemaDepositosController;

