const winston = require('winston');
const path = require('path');
const os = require('os');

const logDirectory = path.join(os.homedir(), 'dados', 'logs');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            // Configuração do timezone para América/São Paulo
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
            const parts = dateFormatter.formatToParts(new Date(timestamp));
            
            // Extraímos dia, mês, ano, hora, minutos e segundos
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            const day = parts.find(p => p.type === 'day').value;
            const hour = parts.find(p => p.type === 'hour').value;
            const minute = parts.find(p => p.type === 'minute').value;
            const second = parts.find(p => p.type === 'second').value;
            
            const formattedDate = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
            
            return `${formattedDate} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logDirectory, 'server.log') }),
        new winston.transports.Console()
    ]
});

module.exports = logger;

