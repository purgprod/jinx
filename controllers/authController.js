const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

exports.login = (req, res) => {
    console.log('Requisição de login recebida:', req.body); // Log para verificar se a requisição chegou

    const { email, password } = req.body;

    // Verifica se o e-mail e a senha foram fornecidos
    if (!email || !password) {
        console.log('E-mail ou senha não fornecidos.');
        return res.status(400).json({ success: false, message: 'Por favor, forneça e-mail e senha.' });
    }

    userModel.findUserByEmail(email, (err, user) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (!user) {
            console.log('Usuário não encontrado:', email);
            return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
        }

        console.log('Usuário encontrado:', user);

        // Comparar a senha fornecida com o hash armazenado
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Erro ao comparar senhas:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            console.log('Resultado da comparação de senhas:', isMatch);

            if (isMatch) {
                req.session.user = user; // Armazena o usuário na sessão após login bem-sucedido
                console.log('Login bem-sucedido:', user);
                return res.status(200).json({ success: true, message: 'Login bem-sucedido' });
            } else {
                console.log('Senhas não correspondem para o usuário:', email);
                return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
            }
        });
    });
};

exports.register = (req, res) => {
    const { email, password } = req.body;

    console.log('Tentativa de registro com:', email); // Log para verificar se a requisição de registro chegou

    // Verifica se o e-mail e a senha foram fornecidos
    if (!email || !password) {
        console.log('E-mail ou senha não fornecidos para registro.');
        return res.status(400).json({ success: false, message: 'Por favor, forneça e-mail e senha.' });
    }

    userModel.findUserByEmail(email, (err, user) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (user) {
            console.log('Tentativa de registro com e-mail já registrado:', email);
            return res.status(400).json({ success: false, message: 'E-mail já registrado' });
        }

        // Criptografar a senha antes de armazenar
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Erro ao criptografar a senha:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            console.log('Senha criptografada com sucesso:', hashedPassword);

            userModel.createUser(email, hashedPassword, (err, userId) => {
                if (err) {
                    console.error('Erro ao registrar o usuário:', err);
                    return res.status(500).json({ success: false, message: 'Erro no servidor' });
                }

                console.log('Usuário registrado com sucesso, ID:', userId);
                return res.status(201).json({ success: true, message: 'Usuário registrado com sucesso', userId });
            });
        });
    });
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
        res.clearCookie('connect.sid'); // Limpa o cookie de sessão
        console.log('Logout bem-sucedido');
        return res.status(200).json({ success: true, message: 'Logout bem-sucedido' });
    });
};

exports.checkSession = (req, res) => {
    if (req.session.user) {
        return res.status(200).json({ authenticated: true });
    } else {
        return res.status(401).json({ authenticated: false });
    }
};
