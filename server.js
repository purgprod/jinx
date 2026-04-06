const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors'); // <--- CORREÇÃO: Necessário para evitar o erro de CORS
const logger = require('./logger');
const cron = require('node-cron');
const axios = require('axios');
const controller_autenticacao_jinx = require('./controllers/controller_autenticacao_jinx');
const route_resultados_financeiros = require('./routes/route_resultados_financeiros');
const route_tokens = require('./routes/route_tokens');
const route_usuarios = require('./routes/route_usuarios');
const route_ecossistema = require('./routes/route_ecossistema');
const route_rotinas = require('./routes/route_rotinas');
const route_assinaturas = require('./routes/route_assinaturas');
const route_emblemas = require('./routes/route_emblemas');
const route_saques = require('./routes/route_saques');
const route_depositos = require('./routes/route_depositos');
const route_endpoints = require('./routes/route_endpoints');

const app = express();
const port = 3000;

// Se o seu servidor está atrás de um proxy (Nginx/HTTPS), isso é necessário para cookies
app.set('trust proxy', 1);

// 1. CONFIGURAÇÃO DE CORS
// Isso resolve o erro "CORS error" e o "401 preflight" no navegador
app.use(cors({
    origin: true, // Permite a origem que está requisitando
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true // Permite o envio de cookies/sessões entre domínios
}));

// Executa as crons
const cronPath = path.join(__dirname, 'controllers/rotinas/cron.js');
require(cronPath);

// Configuração do store de sessão
const sessionStore = new session.MemoryStore();

app.use(session({
    store: sessionStore,
    secret: 'seuSegredoAqui', 
    resave: false, // Alterado para false para melhor performance com MemoryStore
    saveUninitialized: false, 
    rolling: true, 
    cookie: {
        secure: true, // Mantenha true se usar HTTPS. Se testar em localhost puro (HTTP), mude para false.
        sameSite: 'none', // Necessário para cookies em domínios diferentes com HTTPS
        maxAge: 600000 
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

// 2. PARSERS E ARQUIVOS ESTÁTICOS (Devem vir antes das rotas)
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

// Log de requisições
app.use((req, res, next) => {
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- ENDPOINTS DE AUTENTICAÇÃO ---

app.post('/auth/login/jinx', (req, res, next) => {
    logger.info('Login attempt:', req.body);
    next();
}, controller_autenticacao_jinx.login);

app.get('/auth/check-session/jinx', isAuthenticated, (req, res, next) => {
    logger.info('Session check for user:', req.session.user);
    next();
}, controller_autenticacao_jinx.checkSession);

app.post('/auth/logout/jinx', (req, res, next) => {
    logger.info('Logout for user:', req.session.user);
    next();
}, controller_autenticacao_jinx.logout);

// --- PÁGINAS ESTÁTICAS ---

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- ROTAS DO SISTEMA ---

app.use('/', route_resultados_financeiros);
app.use('/', route_tokens);
app.use('/', route_usuarios);
app.use('/', route_ecossistema);
app.use('/', route_rotinas);
app.use('/', route_assinaturas);
app.use('/', route_emblemas);
app.use('/', route_saques);
app.use('/', route_depositos);
app.use('/', route_endpoints);

// Iniciar o servidor
app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
});
