const logger = require('../logger');

exports.checkAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        logger.warn('Acesso negado - Sessão não existe ou está expirada');
        return res.status(401).json({ 
            authenticated: false,
            message: 'Acesso negado. Por favor, faça login primeiro.'
        });
    }
    
    // Renova o tempo da sessão no servidor a cada requisição
    req.session.touch();

    logger.info('Acesso autorizado e sessão renovada');
    next(); // Permite que a requisição prossiga
};

