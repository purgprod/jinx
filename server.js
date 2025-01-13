const express = require('express');
const path = require('path');
const session = require('express-session');
const logger = require('./logger'); // Importa o logger configurado
const authController = require('./controllers/authController');
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

// Endpoints de autenticação
app.post('/auth/login', (req, res, next) => {
    logger.info('Login attempt:', req.body);
    next();
}, authController.login);

app.get('/auth/check-session', isAuthenticated, (req, res, next) => {
    logger.info('Session check for user:', req.session.user);
    next();
}, authController.checkSession);

app.post('/auth/logout', (req, res, next) => {
    logger.info('Logout for user:', req.session.user);
    next();
}, authController.logout);

// Servir páginas estáticas para rotas específicas
app.get('/login', (req, res) => {
    logger.info('Serving login page');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/config', (req, res) => {
    logger.info('Serving config page');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
});

