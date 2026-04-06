const mysql = require('mysql2');
const logger = require('../logger');

const pool = mysql.createPool({
    host:'localhost', // IP do servidor MySQL
    user: 'admin',         // Nome de usuário do MySQL
    password: '178027WaPurg', // Senha do MySQL
    database: 'purg',  // Nome do banco de dados
    port: 3306,            // Porta padrão do MySQL
    waitForConnections: true,
    connectionLimit: 50,   // Número máximo de conexões no pool
    queueLimit: 0          // Número máximo de consultas na fila (0 = ilimitado)
});

pool.getConnection((err, connection) => {
    if (err) {
        logger.error('Erro ao conectar ao banco de dados:', { message: err.message, code: err.code });
        return;
    }
    logger.info('Conectado ao banco de dados MySQL.');
    connection.release();
});

module.exports = pool;

