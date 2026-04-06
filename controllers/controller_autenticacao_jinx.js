const bcrypt = require('bcrypt');
const userModel = require('../models/model_autenticacao_jinx');
const logger = require('../logger');

exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Por favor, forneça e-mail e senha.' });
    }

    userModel.findUserByEmail(email, (err, user) => {
        if (err) {
            logger.error('Erro ao buscar usuário no login');
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                logger.error('Erro ao comparar senhas no login');
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            if (isMatch) {
                req.session.user = user;
                logger.info('Login bem-sucedido');
                return res.status(200).json({ success: true, message: 'Login bem-sucedido' });
            } else {
                return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
            }
        });
    });
};

exports.register = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Por favor, forneça e-mail e senha.' });
    }

    userModel.findUserByEmail(email, (err, user) => {
        if (err) {
            logger.error('Erro ao buscar usuário no registro');
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (user) {
            return res.status(400).json({ success: false, message: 'E-mail já registrado' });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                logger.error('Erro ao criptografar senha no registro');
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            userModel.createUser(email, hashedPassword, (err, userId) => {
                if (err) {
                    logger.error('Erro ao registrar usuário');
                    return res.status(500).json({ success: false, message: 'Erro no servidor' });
                }

                logger.info('Usuário registrado com sucesso');
                return res.status(201).json({ success: true, message: 'Usuário registrado com sucesso', userId });
            });
        });
    });
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            logger.error('Erro ao fazer logout');
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
        res.clearCookie('connect.sid');
        logger.info('Logout realizado');
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
