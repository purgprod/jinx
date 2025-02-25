// controllers/ecossistema/controller_saques_ecossistema.js

const EcossistemaSaquesModel = require('../../models/ecossistema/model_saques_ecossistema');
const logger = require('../../logger');

class EcossistemaSaquesController {

   // Endpoint para obter os saques totais do ecossistema
    static async getSaques(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosSaques = await EcossistemaSaquesModel.getSaques(usuarioId);
            if (dadosSaques) {
                res.status(200).json(dadosSaques);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de saque encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os saques para o ecossistema: ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os saques.' });
        }
    }

}

module.exports = EcossistemaSaquesController;

