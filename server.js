require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');
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
const port = process.env.PORT || 3000;

// Headers de segurança (XSS, CSP, etc.)
app.use(helmet({ contentSecurityPolicy: false }));

// Se o servidor está atrás de um proxy (Nginx/HTTPS)
app.set('trust proxy', 1);

// Configuração de CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
}));

// Rate limiting no login (máx. 10 tentativas por 15 min por IP)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Executa as crons
try {
    const cronPath = path.join(__dirname, 'controllers/rotinas/cron.js');
    require(cronPath);
} catch (err) {
    logger.error('Erro ao carregar cron.js:', err.message);
}

// Configuração do store de sessão
const sessionStore = new session.MemoryStore();

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || (() => { throw new Error('SESSION_SECRET não definido no .env'); })(),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: true,
        sameSite: 'none',
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

app.post('/auth/login/jinx', loginLimiter, (req, res, next) => {
    logger.info(`Login attempt for user: ${req.body?.username}`);
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
const server = app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Porta ${port} já está em uso.`);
    } else {
        logger.error('Erro ao iniciar o servidor:', err.message);
    }
    process.exit(1);
});
