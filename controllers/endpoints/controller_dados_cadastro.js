// controllers/endpoint/controller_dados_cadastro.js

const DadosCadastroModel = require('../../models/endpoints/model_dados_cadastro');
const logger = require('../../logger');

class DadosCadastroController {

   // Endpoint para obter os dados cadastrais do usuário
    static async getDadosCadastro(req, res) {
        const usuarioId = req.params.id;

        try {
            const dadosDadosCadastro = await DadosCadastroModel.getDadosCadastro(usuarioId);
            if (dadosDadosCadastro) {
                res.status(200).json(dadosDadosCadastro);
	    } else {
                res.status(404).json({ message: 'Nenhum dado cadastral encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os dados cadastrais para o usuário ID: ${usuarioId} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os dados cadastrais.' });
        }
    }

}

module.exports = DadosCadastroController;

