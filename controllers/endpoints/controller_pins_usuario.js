// controllers/endpoints/controller_pins_usuario.js

const PinsUsuarioModel = require('../../models/endpoints/model_pins_usuario');
const logger = require('../../logger');

class PinsUsuarioController {

    /**
     * Handler para GET /pins/:usuario_id
     * Gerencia a requisição de listagem de ativos do usuário.
     */
    static async getPinsUsuario(req, res) {
        // 1. Extração semântica do parâmetro. 
        // Se a rota for /pins/:id, use req.params.id. Se for /pins/:usuario_id, use req.params.usuario_id.
        const { id: usuario_id } = req.params;

        // Early return: Validação básica de input antes de onerar o banco/model
        if (!usuario_id) {
            return res.status(400).json({ 
                status: 'error',
                message: 'O parâmetro usuario_id é obrigatório.' 
            });
        }

        try {
            const dadosPinsUsuario = await PinsUsuarioModel.getPinsUsuario(usuario_id);

            // 2. Verificação de conteúdo (Duck Typing/Length check)
            // Como o Model agora retorna [], verificamos se há itens na lista.
            if (dadosPinsUsuario && dadosPinsUsuario.length > 0) {
                // Status 200: OK - Sucesso com corpo de resposta.
                return res.status(200).json({
                    status: 'success',
                    results: dadosPinsUsuario.length,
                    data: dadosPinsUsuario
                });
            }

            // Status 404: Not Found - O recurso (coleção de pins) não existe para este ID.
            return res.status(404).json({ 
                status: 'fail',
                message: `Nenhum pin encontrado para o usuário com ID ${usuario_id}.` 
            });

        } catch (error) {
            // Log detalhado para debug interno
            logger.error(`[PinsUsuarioController] Erro operacional no ID ${usuario_id}: ${error.stack}`);
            
            // Status 500: Internal Server Error - Erro inesperado (banco fora, erro de sintaxe, etc).
            // Retornamos uma mensagem genérica para não expor detalhes da infraestrutura.
            return res.status(500).json({ 
                status: 'error',
                message: 'Ocorreu um erro interno ao processar a consulta de pins.' 
            });
        }
    }
}

module.exports = PinsUsuarioController;
