const express = require('express');
const path = require('path');
const session = require('express-session');
const logger = require('./logger');
const controller_autenticacao = require('./controllers/controller_autenticacao');
const route_resultados_financeiros = require('./routes/route_resultados_financeiros');
const route_tokens = require('./routes/route_tokens');
const model_users = require('./models/model_usuarios.js');

const app = express();
const port = 3000;

// Configuração do store de sessão
const sessionStore = new session.MemoryStore();

app.use(session({
    store: sessionStore,
    secret: 'seuSegredoAqui', // Substitua por um segredo único e seguro
    resave: false,
    saveUninitialized: false, // Salva a sessão apenas se algo foi armazenado
    cookie: {
        secure: false, // Defina como true se estiver usando HTTPS
        maxAge: 24 * 60 * 60 * 1000 // Expira após 24 horas
    }
}));

// Limpa todas as sessões ao reiniciar o servidor
sessionStore.clear((err) => {
    if (err) {
        logger.error('Erro ao limpar as sessões:', err);
    } else {
        logger.info('Todas as sessões foram limpas.');
    }
});

// Middleware para servir arquivos estáticos e processar JSON
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        return res.status(401).json({ authenticated: false });
    }
};

// Adicionando log para cada requisição recebida
app.use((req, res, next) => {
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    logger.info('Query Params:', req.query);
    logger.info('Body:', req.body);
    next();
});

// Endpoint para buscar usuários
app.get('/api/usuarios', async (req, res) => {
    try {
        const users = await model_users.getUsers(); // Para buscar usuários do banco de dados
        res.json(users); // Envia os usuários como resposta em JSON
    } catch (error) {
        logger.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro ao buscar os usuários' });
    }
});

// Endpoint para obter o próximo usuario_id
app.get('/api/usuarios/next-id', async (req, res) => {
    try {
        const nextId = await model_users.getNextUserId(); // Chama a função para obter o próximo id
        res.json({ nextId }); // Retorna o próximo id em formato JSON
    } catch (error) {
        logger.error('Erro ao obter próximo usuario_id:', error);
        res.status(500).json({ error: 'Erro ao obter próximo usuario_id' });
    }
});

// Endpoint para alterar a senha do usuário
app.post('/api/usuarios/:id/change-password', async (req, res) => {
    const usuarioId = req.params.id; // Obtém o ID do usuário da rota
    const { password } = req.body; // Obtém a nova senha do corpo da requisição

    try {
        // Atualiza a senha no banco de dados
        await model_users.updatePassword(usuarioId, password); // Chama a função updatePassword
        res.status(200).send('Senha alterada com sucesso'); // Retorna sucesso
    } catch (error) {
        logger.error('Erro ao alterar a senha:', error);
        res.status(500).send('Erro ao alterar a senha'); // Retorna erro em caso de falha
    }
});

// Endpoint para criar um novo usuário
app.post('/api/usuarios', async (req, res) => {
    const { nome, email, password } = req.body; // Obtenha os dados do corpo da requisição

    try {
        const usuarioId = await model_users.getNextUserId(); // Obter o próximo usuario_id
        await model_users.createUser({ usuario_id: usuarioId, nome, email, password }); // Chama a função createUser sem created_at
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        logger.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Endpoint para buscar um usuário pelo e-mail
app.get('/api/usuarios/:email', async (req, res) => {
    const { email } = req.params; // Obtém o e-mail da rota

    try {
        // Chama a função para buscar o usuário pelo e-mail
        const user = await model_users.getUserByEmail(email);
        if (user) {
            res.status(200).json(user); // Retorna os dados do usuário
        } else {
            res.status(404).send('Usuário não encontrado.'); // Retorna mensagem de erro se não encontrado
        }
    } catch (error) {
        logger.error('Erro ao buscar usuário pelo e-mail:', error);
        res.status(500).send('Erro ao buscar usuário.'); // Mensagem de erro do servidor
    }
});

// Endpoints de autenticação
app.post('/auth/login', (req, res, next) => {
    logger.info('Login attempt:', req.body);
    next();
}, controller_autenticacao.login);

app.get('/auth/check-session', isAuthenticated, (req, res, next) => {
    logger.info('Session check for user:', req.session.user);
    next();
}, controller_autenticacao.checkSession);

app.post('/auth/logout', (req, res, next) => {
    logger.info('Logout for user:', req.session.user);
    next();
}, controller_autenticacao.logout);

// Servir páginas estáticas para rotas específicas
app.get('/login', (req, res) => {
    logger.info('Serving login page');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/config', (req, res) => {
    logger.info('Serving config page');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Usar o roteador para resultados financeiros
app.use('/', route_resultados_financeiros); // Prefixo das rotas para resultados financeiros

// Usar o roteador para tokens
app.use('/', route_tokens); // Prefixo das rotas para tokens

// Iniciar o servidor
app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
});
