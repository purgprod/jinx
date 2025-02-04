// controllers/usuarios/controller_resetarsenha_usuarios.js

const UsuariosAtualizarSenhaModel = require('../../models/usuarios/model_atualizarsenha_usuarios');
const logger = require('../../logger');

class UsuariosResetarSenhaController {


    // Endpoint para redefinir a senha de um usuário
    static async resetarSenha(req, res) {
        const id = req.params.id;

        try {
            // Aqui você pode gerar uma nova senha ou definir uma senha padrão
            const novaSenha = "purg123";  // Você pode personalizar ou gerar uma nova senha

            // Chama a função no modelo para atualizar a senha
            await UsuariosAtualizarSenhaModel.atualizarSenha(id, novaSenha);

            logger.info(`Senha redefinida para o usuário com ID: ${id}`);
            res.status(200).json({ message: 'Senha redefinida com sucesso!' });
        } catch (error) {
            logger.error('Erro ao redefinir a senha:', error);
            res.status(500).json({ error: 'Erro ao redefinir a senha' });
        }
    }
}

module.exports = UsuariosResetarSenhaController;

