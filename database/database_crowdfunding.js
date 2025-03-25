const mysql = require('mysql2');

const pool = mysql.createPool({
    host:'3.144.232.130', // IP do servidor MySQL
    user: 'admin',         // Nome de usuário do MySQL
    password: 'Purgtrihold', // Senha do MySQL
    database: 'crowdfunding',  // Nome do banco de dados
    port: 3306,            // Porta padrão do MySQL
    waitForConnections: true,
    connectionLimit: 10,   // Número máximo de conexões no pool
    queueLimit: 0          // Número máximo de consultas na fila (0 = ilimitado)
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL.');
    connection.release();
});

module.exports = pool;

