// controllers/usuarios/controller_resetarsenha_usuarios.js

const crypto = require('crypto');
const UsuariosAtualizarSenhaModel = require('../../models/usuarios/model_atualizarsenha_usuarios');
const logger = require('../../logger');

function gerarSenhaAleatoria() {
    const maiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros    = '0123456789';
    const especiais  = '!@#$%*';
    const todos      = maiusculas + minusculas + numeros + especiais;

    const getRandom = (str) => str[crypto.randomInt(str.length)];

    const chars = [
        getRandom(maiusculas),
        getRandom(especiais),
        ...Array.from({ length: 6 }, () => getRandom(todos))
    ];

    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
}

class UsuariosResetarSenhaController {

    // Endpoint para redefinir a senha de um usuário
    static async resetarSenha(req, res) {
        const id = req.params.id;

        try {
            const novaSenha = gerarSenhaAleatoria();

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

