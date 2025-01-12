const express = require('express');
const path = require('path');
const session = require('express-session');
const logger = require('./logger'); // Importa o logger configurado
const authController = require('./controllers/authController');
const timesController = require('./controllers/timesController');
const mercadoGolsMandanteController = require('./controllers/mercadoGolsMandanteController');
const mercadoGolsVisitanteController = require('./controllers/mercadoGolsVisitanteController');
const mercadoEscanteiosMandanteController = require('./controllers/mercadoEscanteiosMandanteController');
const backtestController = require('./controllers/backtestController');
const backtestingInputControllerGolsMandante = require('./controllers/backtestingInputControllerGolsMandante');
const backtestingInputControllerGolsVisitante = require('./controllers/backtestingInputControllerGolsVisitante');
const backtestingInputControllerEscanteiosMandante = require('./controllers/backtestingInputControllerEscanteiosMandante');

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

// Adicionando logs para diagnóstico
logger.info('timesController.getTimes:', timesController.getTimes);
logger.info('mercadoGolsMandanteController.getGolsMandante:', mercadoGolsMandanteController.getGolsMandante);
logger.info('mercadoGolsVisitanteController.getGolsVisitante:', mercadoGolsVisitanteController.getGolsVisitante);
logger.info('mercadoEscanteiosMandanteController.getEscanteiosMandante:', mercadoEscanteiosMandanteController.getEscanteiosMandante);

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

// Endpoints de times
app.get('/times', isAuthenticated, (req, res, next) => {
    logger.info('Fetching times');
    next();
}, timesController.getTimes);

// Endpoints de mercado de gols
app.get('/mercado-gols-mandante', isAuthenticated, (req, res) => {
    logger.info('Fetching gols mandante:', req.query);
    mercadoGolsMandanteController.getGolsMandante(req, res);
});

app.get('/mercado-gols-visitante', isAuthenticated, (req, res) => {
    logger.info('Fetching gols visitante:', req.query);
    mercadoGolsVisitanteController.getGolsVisitante(req, res);
});

// Endpoint de mercado de escanteios
app.get('/mercado-escanteios-mandante', isAuthenticated, (req, res) => {
    logger.info('Fetching escanteios mandante:', req.query);
    mercadoEscanteiosMandanteController.getEscanteiosMandante(req, res);
});

// Endpoint para backtesting
app.get('/backtest', (req, res, next) => {
    logger.info('Running backtest:', req.query);
    next();
}, backtestController.runBacktest);

// Endpoint para backtesting do gols mandante com o novo controller
app.get('/backtestinginput-gols-mandante', isAuthenticated, (req, res, next) => {
    logger.info('Running backtesting input for gols mandante:', req.query);
    next();
}, backtestingInputControllerGolsMandante.runBacktestingGolsMandante);

// Endpoint para backtesting do gols visitante com o novo controller
app.get('/backtestinginput-gols-visitante', isAuthenticated, (req, res, next) => {
    logger.info('Running backtesting input for gols visitante:', req.query);
    next();
}, backtestingInputControllerGolsVisitante.runBacktestingGolsVisitante);

// Endpoint para backtesting do escanteios mandante com o novo controller
app.get('/backtestinginput-escanteios-mandante', isAuthenticated, (req, res, next) => {
    logger.info('Running backtesting input for escanteios mandante:', req.query);
    next();
}, backtestingInputControllerEscanteiosMandante.runBacktestingEscanteiosMandante);

// Servir páginas estáticas para rotas específicas
app.get('/login', (req, res) => {
    logger.info('Serving login page');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/backtesting', (req, res) => {
    logger.info('Serving backtesting page');
    res.sendFile(path.join(__dirname, 'public', 'backtest.html'));
});

app.get('/config', (req, res) => {
    logger.info('Serving config page');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
});

