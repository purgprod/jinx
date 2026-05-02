// controllers/endpoints/controller_autenticacao_purg.js
const bcrypt    = require('bcrypt');
const userModel = require('../../models/endpoints/model_autenticacao_purg');
const logger    = require('../../logger');

/**
 * POST /api/v1/login
 * body: { email, password }
 */
async function login(req, res) {
    logger.info('Requisição de login recebida para Purg:', req.body);

    /* ---------- Validação do corpo ---------- */
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
            success : false,
            message : 'Por favor, forneça e-mail e senha válidos.'
        });
    }

    const emailTratado = email.trim().toLowerCase();
    logger.info('E-mail tratado:', emailTratado);

    try {
        /* ---------- Busca usuário ---------- */
        const user = await userModel.findUserByEmail(emailTratado);

        if (!user) {
            logger.info(`Usuário não encontrado na Purg: ${emailTratado}`);
            return res.status(401).json({
                success : false,
                message : 'E-mail ou senha inválidos'
            });
        }

        logger.info('Usuário encontrado:', user);

        /* ---------- Compara senha ---------- */
        const isMatch = await bcrypt.compare(password, user.password);
        logger.info(`Resultado da comparação de senhas: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({
                success : false,
                message : 'E-mail ou senha inválidos'
            });
        }

        /* ---------- Cria sessão ---------- */
        req.session.user = {
            id           : user.usuario_id,
            email        : user.email,
            nome         : user.apelido,
            nome_completo: user.nome_completo
        };

        logger.info(`Login bem-sucedido na Purg: ${user.email}`);
        return res.status(200).json({
            success    : true,
            message    : 'Login bem-sucedido',
            usuario_id : user.usuario_id,
            avatar_id  : user.avatar_id ?? null
        });

    } catch (err) {
        logger.error(`Erro no login da Purg: ${err.message}`);
        logger.error(err);
        return res.status(500).json({
            success : false,
            message : 'Erro no servidor'
        });
    }
}

/**
 * POST /api/v1/register
 * body: { email, password }
 */
async function register(req, res) {
    logger.info('Tentativa de registro na Purg:', req.body);

    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
            success : false,
            message : 'Por favor, forneça e-mail e senha válidos.'
        });
    }

    try {
        const existente = await userModel.findUserByEmail(email.trim().toLowerCase());
        if (existente) {
            logger.info(`Tentativa de registro com e-mail já registrado: ${email}`);
            return res.status(400).json({
                success : false,
                message : 'E-mail já registrado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        logger.info('Senha criptografada com sucesso');

        const userId = await userModel.createUser(email.trim().toLowerCase(), hashedPassword);

        logger.info(`Usuário registrado com sucesso, ID: ${userId}`);
        return res.status(201).json({
            success    : true,
            message    : 'Usuário registrado com sucesso',
            usuario_id : userId
        });

    } catch (err) {
        logger.error(`Erro ao registrar usuário na Purg: ${err.message}`);
        logger.error(err);
        return res.status(500).json({
            success : false,
            message : 'Erro no servidor'
        });
    }
}

/**
 * POST /api/v1/logout
 */
function logout(req, res) {
    req.session.destroy(err => {
        if (err) {
            logger.error(`Erro ao fazer logout na Purg: ${err.message}`);
            logger.error(err);
            return res.status(500).json({
                success : false,
                message : 'Erro no servidor'
            });
        }
        res.clearCookie('connect.sid');
        logger.info('Logout bem-sucedido na Purg');
        return res.status(200).json({
            success : true,
            message : 'Logout bem-sucedido na Purg'
        });
    });
}

/**
 * POST /api/v1/check-session
 */
function checkSession(req, res) {
    logger.info('Verificando sessão. Sessão:', req.session);

    if (req.session.user) {
        return res.status(200).json({
            authenticated : true,
            user : {
                id    : req.session.user.id,
                email : req.session.user.email,
                nome  : req.session.user.nome
            }
        });
    }
    logger.info('Nenhuma sessão encontrada ou sessão expirada');
    return res.status(401).json({
        authenticated : false,
        message       : 'Sessão expirada ou não autenticada'
    });
}

/* ------------------------------------------------------------------ */
/* Exporta todas as funções de forma explícita                        */
/* ------------------------------------------------------------------ */
module.exports = {
    login,
    register,
    logout,
    checkSession
};

