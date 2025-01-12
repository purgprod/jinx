const winston = require('winston');
const path = require('path');
const os = require('os');

// Caminho para o diretório de logs no diretório home do usuário
const logDirectory = path.join(os.homedir(), 'dados', 'logs');

// Configuração do logger
const logger = winston.createLogger({
    level: 'info', // Nível de log (info, warn, error, etc.)
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logDirectory, 'server.log') }), // Caminho para o arquivo de log
        new winston.transports.Console() // Também loga no console
    ]
});

module.exports = logger;

