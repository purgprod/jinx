// Importa a biblioteca node-cron
const cron = require('node-cron');

// Agendar uma tarefa para ser executada a cada minuto
// A sintaxe é similar ao cron do Unix
cron.schedule('* * * * *', () => {
    console.log('Executando tarefa a cada minuto');
});
