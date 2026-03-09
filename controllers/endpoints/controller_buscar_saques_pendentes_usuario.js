// controllers/endpoints/controller_buscar_saques_pendentes_usuario.js
const BuscarSaquePendenteModel = require('../../models/endpoints/model_saque_buscar_saque_pendente_usuario');
const logger = require('../../logger');

const BuscarSaquesPendentesUsuarioController = {
    async getSaquesPendentes(req, res) {
        // A desestruturação busca exatamente o nome definido na rota (:id)
        const { id } = req.params;

        // Fail-fast: Validação de presença e tipo básico
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ 
                error: 'O parâmetro id é obrigatório e deve ser um identificador válido.' 
            });
        }

        logger.info(`Iniciando busca de saques pendentes para id: ${id}`);

        try {
            const saques = await BuscarSaquePendenteModel.getSaquePendente(id);
            
            // Semântica HTTP 200: A consulta foi processada com sucesso. 
            // Uma lista vazia [] é um resultado válido de busca, não um erro 404.
            logger.info(`Busca finalizada para user ${id}: ${saques.length} registros encontrados.`);
            return res.status(200).json(saques);
            
        } catch (error) {
            // Log detalhado para debug interno, mas mensagem genérica para o cliente (segurança)
            logger.error(`Erro crítico na query de saques (User: ${id}):`, error.message);
            return res.status(500).json({ error: 'Erro interno ao processar a consulta de saques.' });
        }
    }
};

module.exports = BuscarSaquesPendentesUsuarioController;
