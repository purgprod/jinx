// controllers/endpoint/controller_saldo.js

const SaldoModel = require('../../models/endpoints/model_saldo');
const logger = require('../../logger');

class SaldoController {

   // Endpoint para obter o saldo total do usuário
    static async getSaldo(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosSaldo = await SaldoModel.getSaldo(usuarioId);
            if (dadosSaldo) {
                res.status(200).json(dadosSaldo);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de saldo encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os saldo para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os saldo.' });
        }
    }

}

module.exports = SaldoController;

