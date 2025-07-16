const express = require('express');
const path = require('path');
const session = require('express-session');
const logger = require('./logger');
const cron = require('node-cron');
const axios = require('axios');
const controller_autenticacao = require('./controllers/controller_autenticacao');
const route_resultados_financeiros = require('./routes/route_resultados_financeiros');
const route_tokens = require('./routes/route_tokens');
const route_usuarios = require('./routes/route_usuarios');
const route_ecossistema = require('./routes/route_ecossistema');
const route_rotinas = require('./routes/route_rotinas');
const route_assinaturas = require('./routes/route_assinaturas');
const route_emblemas = require('./routes/route_emblemas');

const app = express();
const port = 3000;

// Executa as crons
const cronPath = path.join(__dirname, 'controllers/rotinas/cron.js');
require(cronPath);

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

//Usar o roteador para usuarios
app.use('/', route_usuarios); // Prefixo das rotas para usuarios

//Usar o roteador para ecossistema
app.use('/', route_ecossistema); // Prefixo das rotas para ecossistema

//Usar o roteador para rotinas
app.use('/', route_rotinas); // Prefixo das rotas para rotinas

//Usar o roteador para assinaturas
app.use('/', route_assinaturas); // Prefixo das rotas para assinaturas

//Usar o roteador para emblemas
app.use('/', route_emblemas); // Prefixo das rotas para emblemas

// Iniciar o servidor
app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
});
