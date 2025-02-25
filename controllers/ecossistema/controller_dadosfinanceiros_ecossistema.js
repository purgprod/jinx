// controllers/ecossistema/controller_dadosfinanceiros_ecossistema.js

const EcossistemaUltimosDadosFinanceirosModel = require('../../models/ecossistema/model_ultimosdadosfinanceiros_ecossistema');
const logger = require('../../logger');

class EcossistemaDadosFinanceirosController {

    // Endpoint para obter os últimos dados financeiros
    static async getUltimosDadosFinanceiros(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosFinanceiros = await EcossistemaUltimosDadosFinanceirosModel.getUltimosDadosFinanceiros(usuarioId);
            if (dadosFinanceiros) {
                res.status(200).json(dadosFinanceiros);
            } else {
                res.status(404).json({ message: 'Nenhum dado financeiro encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar últimos dados financeiros para o ecossistema: ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar últimos dados financeiros.' });
        }
    }
}

module.exports = EcossistemaDadosFinanceirosController;

