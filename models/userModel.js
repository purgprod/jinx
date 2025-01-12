const mysql = require('mysql2');

// Configuração do banco de dados MySQL
const connection = mysql.createConnection({
    host: '18.116.69.207',
    user: 'admin',
    password: 'Purgtrihold',
    database: 'usuarios' // Este deve ser o nome do banco de dados correto para usuários
});

// Função para encontrar um usuário pelo e-mail
exports.findUserByEmail = (email, callback) => {
    console.log('Buscando usuário com e-mail:', email); // Log do e-mail sendo buscado

    const query = 'SELECT * FROM users WHERE email = ?';
    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            callback(err, null);
            return;
        }

        console.log('Resultados da consulta:', results); // Log dos resultados encontrados

        if (results.length > 0) {
            console.log('Usuário encontrado:', results[0]);
            callback(null, results[0]);
        } else {
            console.log('Nenhum usuário encontrado com este e-mail.');
            callback(null, null);
        }
    });
};

// Função para criar um novo usuário
exports.createUser = (email, hashedPassword, callback) => {
    const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
    connection.query(query, [email, hashedPassword], (err, results) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            callback(err, null);
            return;
        }
        console.log('Usuário criado com sucesso, ID:', results.insertId);
        callback(null, results.insertId);
    });
};
