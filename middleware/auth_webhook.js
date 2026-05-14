const logger = require('../logger');

module.exports = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!process.env.N8N_API_KEY) {
        logger.error('[Webhook] N8N_API_KEY não definido no .env');
        return res.status(500).json({ error: 'Configuração interna ausente.' });
    }
    if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
        logger.warn(`[Webhook] Acesso negado — IP: ${req.ip}`);
        return res.status(401).json({ error: 'Não autorizado.' });
    }
    next();
};
