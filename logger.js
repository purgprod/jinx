const winston = require('winston');
const path = require('path');
const os = require('os');
require('winston-daily-rotate-file');

const logDirectory = path.join(os.homedir(), 'dados', 'logs');

// Formatter cacheado fora do callback para evitar recriação a cada log
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const parts = dateFormatter.formatToParts(new Date(timestamp));
        const get = (type) => parts.find(p => p.type === type).value;
        const formattedDate = `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;

        let log = `${formattedDate} [${level}]: ${message}`;

        if (stack) log += `\n${stack}`;

        const metaKeys = Object.keys(meta).filter(k => k !== 'service');
        if (metaKeys.length > 0) {
            log += ` | ${JSON.stringify(meta)}`;
        }

        return log;
    })
);

const debugTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDirectory, 'debug-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '50m',
    maxFiles: '60d',
    zippedArchive: true,
    level: 'debug',
    silent: false
});

const logger = winston.createLogger({
    level: 'debug',
    format: logFormat,
    transports: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDirectory, 'server-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '60d',
            zippedArchive: true,
            level: 'info'
        }),
        new winston.transports.Console({ level: 'info' }),
        debugTransport
    ]
});

let _debugEnabled = true;

logger.setDebugMode = function (enabled) {
    _debugEnabled = enabled;
    if (enabled) {
        logger.level = 'debug';
        debugTransport.silent = false;
        logger.info('[DEBUG] Modo debug ATIVADO — logs gravados em debug-*.log');
    } else {
        logger.level = 'info';
        debugTransport.silent = true;
        logger.info('[DEBUG] Modo debug DESATIVADO');
    }
};

logger.isDebugEnabled = function () {
    return _debugEnabled;
};

module.exports = logger;
