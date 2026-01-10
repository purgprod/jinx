// controllers/endpoint/controller_dados_empresa.js

const DadosEmpresaModel = require('../../models/endpoints/model_dados_empresa');
const logger = require('../../logger');

class DadosEmpresaController {

   // Endpoint para obter os dados cadastrais do usuário
    static async getDadosEmpresa(req, res) {
        const id_empresa = req.params.id;

        try {
            const dadosDadosEmpresa = await DadosEmpresaModel.getDadosEmpresa(id_empresa);
            if (dadosDadosEmpresa) {
                res.status(200).json(dadosDadosEmpresa);
	    } else {
                res.status(404).json({ message: 'Nenhum dado cadastral da empresa encontrado.' });
            }
        } catch (error) {
            logger.error(`Erro ao buscar os dados cadastrais para a empresa ID: ${id_empresa} - ${error.message}`);
            res.status(500).json({ error: 'Erro ao buscar os dados cadastrais.' });
        }
    }

}

module.exports = DadosEmpresaController;

