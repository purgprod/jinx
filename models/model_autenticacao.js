// models/model_autenticacao.js
const pool = require('../database/database_purg');

// Função para encontrar um usuário pelo e-mail
exports.findUserByEmail = (email, callback) => {
    console.log('Buscando usuário com e-mail:', email);

    const query = 'SELECT * FROM users_jinx WHERE email = ?';
    pool.query(query, [email], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            callback(err, null);
            return;
        }

        console.log('Resultados da consulta:', results);

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
    const query = 'INSERT INTO users_jinx (email, password) VALUES (?, ?)';
    pool.query(query, [email, hashedPassword], (err, results) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            callback(err, null);
            return;
        }
        console.log('Usuário criado com sucesso, ID:', results.insertId);
        callback(null, results.insertId);
    });
};

