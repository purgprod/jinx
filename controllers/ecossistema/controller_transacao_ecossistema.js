// controllers/ecossistema/controller_transacao_ecossistema.js

const EcossistemaTransacaoModel = require('../../models/ecossistema/model_transacao_ecossistema');
const logger = require('../../logger');

class EcossistemaTransacaoController {

   // Endpoint para obter as transações totais do ecossistema
    static async getTransacao(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosTransacao = await EcossistemaTransacaoModel.getTransacao(usuarioId);
            if (dadosTransacao) {
                res.status(200).json(dadosTransacao);
	    } else {
                res.status(404).json({ message: 'Nenhum dado de transação encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar transação para o ecossistema: ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar transação.' });
        }
    }

}

module.exports = EcossistemaTransacaoController;

