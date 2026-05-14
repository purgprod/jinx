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
const route_depositos  = require('./routes/route_depositos');
const route_endpoints  = require('./routes/route_endpoints');
const route_biometria  = require('./routes/route_biometria');
const route_objetivos  = require('./routes/route_objetivos');
const route_ranking    = require('./routes/route_ranking');
const route_lulu       = require('./routes/route_lulu');
const route_admin            = require('./routes/route_admin');
const route_senha_negociacao = require('./routes/route_senha_negociacao');
const route_familia          = require('./routes/route_familia');
const route_eventos          = require('./routes/route_eventos');
const route_indicacoes       = require('./routes/route_indicacoes');
const route_webhook          = require('./routes/route_webhook');

const app = express();
const port = process.env.PORT || 3000;

// Headers de segurança (XSS, CSP, etc.)
app.use(helmet({ contentSecurityPolicy: false }));

// Se o servidor está atrás de um proxy (Nginx/HTTPS)
app.set('trust proxy', 1);

// Configuração de CORS
// ALLOWED_ORIGINS deve ser definido no .env de cada servidor (ex: https://jinx.purg.com.br)
if (!process.env.ALLOWED_ORIGINS) {
    logger.warn('ALLOWED_ORIGINS não definido no .env — requisições cross-origin serão bloqueadas');
}
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false,
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
    legacyHeaders: false,
    keyGenerator: (req) => req.ip?.replace(/^::ffff:/, '') ?? 'unknown',
    validate: { keyGeneratorIpFallback: false },
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
        httpOnly: true,
        sameSite: 'lax',
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

// Middleware para verificar se o usuário está autenticado (retorna JSON 401 — usado por chamadas AJAX)
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        return res.status(401).json({ authenticated: false });
    }
};

// Middleware de autenticação para rotas de página (redireciona para /login em vez de retornar JSON)
const isAuthenticatedPage = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    return res.redirect('/login');
};

// Log de requisições
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

const CAMPOS_SENSIVEIS = ['password', 'senha', 'nova_senha', 'senha_atual',
    'senha_negociacao', 'nova_senha_negociacao', 'token', 'token_convite'];

function sanitizarLog(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) =>
            CAMPOS_SENSIVEIS.includes(k) ? [k, '***'] : [k, v]
        )
    );
}

// Debug: loga body/query de entrada e o corpo de cada resposta JSON
app.use((req, res, next) => {
    if (!logger.isDebugEnabled()) return next();

    const body  = req.body  && Object.keys(req.body).length  ? JSON.stringify(sanitizarLog(req.body))  : '—';
    const query = req.query && Object.keys(req.query).length ? JSON.stringify(req.query) : '—';
    logger.debug(`[REQ] ${req.method} ${req.url} | body: ${body} | query: ${query}`);

    const _json = res.json.bind(res);
    res.json = function (data) {
        logger.debug(`[RES] ${req.method} ${req.url} → ${res.statusCode} | ${JSON.stringify(data).substring(0, 500)}`);
        return _json(data);
    };

    next();
});

// --- ENDPOINTS DE AUTENTICAÇÃO ---

app.post('/auth/login/jinx', loginLimiter, (req, res, next) => {
    logger.info('Login attempt received');
    next();
}, controller_autenticacao_jinx.login);

app.get('/auth/check-session/jinx', isAuthenticated, (req, res, next) => {
    logger.info('Session check received');
    next();
}, controller_autenticacao_jinx.checkSession);

app.post('/auth/logout/jinx', (req, res, next) => {
    logger.info('Logout received');
    next();
}, controller_autenticacao_jinx.logout);

// --- PÁGINAS ESTÁTICAS ---

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- ROTAS DE NAVEGAÇÃO SPA (todas servem index.html, autenticação obrigatória) ---

const rotasSPA = [
    '/home',
    '/usuarios',
    '/resultados-financeiros',
    '/pins',
    '/ecossistema',
    '/assinaturas',
    '/emblemas',
    '/saques',
    '/depositos',
    '/rotinas',
    '/ranking',
    '/lulu',
    '/familia',
    '/admin',
];

rotasSPA.forEach(rota => {
    app.get(rota, isAuthenticatedPage, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
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
app.use('/', route_biometria);
app.use('/', route_endpoints);
app.use('/', route_objetivos);
app.use('/', route_ranking);
app.use('/', route_lulu);
app.use('/', route_admin);
app.use('/', route_senha_negociacao);
app.use('/', route_familia);
app.use('/', route_eventos);
app.use('/', route_indicacoes);
app.use('/', route_webhook);

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
